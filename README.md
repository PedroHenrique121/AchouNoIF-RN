# AchouNoIF V2 — Backend + Frontend

Projeto separado em duas partes:

- `backend/` → Node.js + Express + MySQL + Firebase Admin + Multer
- `frontend/` → React Native/Expo

## Correções aplicadas

O projeto agora usa a URL do backend por variável de ambiente, sincroniza usuários do Firebase com o MySQL, registra `id_usuario_cadastro` nos objetos, carrega categorias diretamente do banco e restringe edição/exclusão de objetos a funcionários e administradores.

## 1. Banco de dados

Use `frontend/bancoPP3.sql` para criar o banco do zero.

Se você já possui o banco antigo, execute no MySQL:

```sql
ALTER TABLE usuarios
  MODIFY senha VARCHAR(255) NULL,
  ADD COLUMN firebase_uid VARCHAR(128) UNIQUE;
```

A senha não é usada pelo sistema porque a autenticação é feita pelo Firebase Authentication. O backend usa `firebase_uid` para relacionar o usuário autenticado ao registro no MySQL.

Para transformar um usuário em funcionário ou administrador:

```sql
UPDATE usuarios
SET tipo_usuario = 'funcionario'
WHERE email = 'email-do-funcionario@exemplo.com';
```

ou:

```sql
UPDATE usuarios
SET tipo_usuario = 'admin'
WHERE email = 'email-do-admin@exemplo.com';
```

## 2. Backend

Entre na pasta:

```bash
cd backend
npm install
```

Crie o arquivo `.env` a partir de `.env.example` e preencha:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=achouif
```

### Firebase Admin

Em desenvolvimento, você pode colocar `backend/serviceAccountKey.json`.

Para configurar a API sem alterar o código, use a variável:

```env
FIREBASE_SERVICE_ACCOUNT_JSON={JSON_COMPLETO_DA_SERVICE_ACCOUNT}
```

Também é possível usar separadamente:

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Nunca envie a Service Account para o GitHub.

Depois:

```bash
npm start
```

Teste no navegador:

```text
http://localhost:3000/health
```

## 3. Frontend

Entre na pasta:

```bash
cd frontend
npm install
```

Crie `frontend/.env` a partir de `frontend/.env.example`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Depois rode:

```bash
npx expo start
```

### URL da API sem trocar IP no código

O arquivo `frontend/src/config/api.js` lê `EXPO_PUBLIC_API_URL`. Assim, você altera somente a variável de ambiente quando precisar mudar o endereço local da API.

Para desenvolvimento local no Android Emulator, sem `.env`, o fallback é `http://10.0.2.2:3000`. Para Web/iOS Simulator, o fallback é `http://localhost:3000`.

No celular físico, use o IPv4 do computador na mesma rede, por exemplo `http://192.168.0.10:3000`.

## 4. Usuários e autenticação

O cadastro segue este fluxo:

1. O Firebase Authentication cria a conta e controla a senha.
2. O app chama `POST /usuarios` com o token Firebase.
3. O backend valida o token.
4. O usuário é inserido/atualizado na tabela `usuarios` usando `firebase_uid`.

Além disso, o middleware de autenticação sincroniza automaticamente usuários antigos do Firebase quando eles acessam uma rota protegida.

## 5. Objetos

Ao cadastrar um objeto, o backend grava também `id_usuario_cadastro`, relacionando o objeto ao usuário autenticado.

- `POST /itens` → usuário autenticado pode cadastrar objeto.
- `PUT /itens/:id` → somente funcionário/admin.
- `DELETE /itens/:id` → somente funcionário/admin.

## 6. Categorias

O frontend não mantém mais uma lista fixa de categorias. A tela de cadastro consulta:

```text
GET /categorias
```

e usa os registros da tabela `categorias`.

## 7. Fotos

Por padrão, as fotos ficam em `backend/uploads/`. É possível configurar outro diretório com:

```env
UPLOADS_DIR=/var/data/uploads
```

Para uso local, o diretório de uploads fica no próprio backend.

## 8. Arquivo duplicado removido

Foi removido o antigo `frontend/CriarObjetoScreen.js`. A tela oficial é:

```text
frontend/src/screens/CriarObjetoScreen.js
```
# AchouNoIF-RN
