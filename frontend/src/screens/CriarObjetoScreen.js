import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { auth } from "../config/firebase";
import { API_URL } from "../config/api";

const estados = [
  { valor: "novo", nome: "Novo" },
  { valor: "bom", nome: "Bom" },
  { valor: "danificado", nome: "Danificado" },
  { valor: "quebrado", nome: "Quebrado" },
];

const statusOpcoes = [
  { valor: "perdido", nome: "Perdido" },
  { valor: "entregue", nome: "Encontrado" },
];

export default function CriarObjetoScreen({ navigation }) {
  const [nomeObjeto, setNomeObjeto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataEncontro, setDataEncontro] = useState("");
  const [localEncontro, setLocalEncontro] = useState("");
  const [categorias, setCategorias] = useState([]);
  const [idCategoria, setIdCategoria] = useState(null);
  const [estadoObjeto, setEstadoObjeto] = useState(null);
  const [statusObjeto, setStatusObjeto] = useState("perdido");
  const [foto, setFoto] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [carregandoCategorias, setCarregandoCategorias] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregarCategorias() {
      try {
        const resposta = await fetch(`${API_URL}/categorias`);
        const dados = await resposta.json().catch(() => []);

        if (!resposta.ok) {
          throw new Error(dados?.erro || "Não foi possível carregar as categorias.");
        }

        if (ativo) setCategorias(Array.isArray(dados) ? dados : []);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        if (ativo) {
          setCategorias([]);
          Alert.alert(
            "Erro",
            "Não foi possível carregar as categorias. Verifique se o backend está funcionando."
          );
        }
      } finally {
        if (ativo) setCarregandoCategorias(false);
      }
    }

    carregarCategorias();
    return () => {
      ativo = false;
    };
  }, []);

  async function adicionarFoto() {
    try {
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert(
          "Permissão necessária",
          "Permita o acesso às fotos para selecionar uma imagem."
        );
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!resultado.canceled && resultado.assets?.length) {
        const imagem = resultado.assets[0];

        if (imagem.fileSize && imagem.fileSize > 5 * 1024 * 1024) {
          Alert.alert("Imagem muito grande", "Escolha uma imagem de até 5 MB.");
          return;
        }

        setFoto(imagem);
      }
    } catch (error) {
      console.error("Erro ao selecionar foto:", error);
      Alert.alert("Erro", "Não foi possível selecionar a foto.");
    }
  }

  async function cadastrarObjeto() {
    if (
      !nomeObjeto.trim() ||
      !descricao.trim() ||
      !dataEncontro.trim() ||
      !localEncontro.trim() ||
      !idCategoria ||
      !estadoObjeto ||
      !statusObjeto
    ) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios.");
      return;
    }

    const usuario = auth.currentUser;

    if (!usuario) {
      Alert.alert("Sessão expirada", "Faça login novamente.");
      return;
    }

    setSalvando(true);

    try {
      const token = await usuario.getIdToken();
      const formData = new FormData();

      formData.append("nome_objeto", nomeObjeto.trim());
      formData.append("descricao", descricao.trim());
      formData.append("data_encontro", dataEncontro.trim());
      formData.append("local_encontro", localEncontro.trim());
      formData.append("id_categoria", String(idCategoria));
      formData.append("estado_objeto", estadoObjeto);
      formData.append("status_objeto", statusObjeto);

      if (foto?.uri) {
        const nomeArquivo = foto.fileName || `foto-${Date.now()}.jpg`;
        const tipo = foto.mimeType || "image/jpeg";
        formData.append("foto", {
          uri: foto.uri,
          name: nomeArquivo,
          type: tipo,
        });
      }

      const resposta = await fetch(`${API_URL}/itens`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(data.erro || "Não foi possível cadastrar o objeto.");
      }

      Alert.alert(
        "Item salvo!",
        "O objeto foi salvo no banco de dados com sucesso.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error("Erro ao cadastrar objeto:", error);
      Alert.alert("Erro", error.message || "Erro de conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Adicionar Item</Text>
        <TouchableOpacity
          style={styles.headerBotao}
          onPress={() => navigation.goBack()}
          disabled={salvando}
          activeOpacity={0.8}
        >
          <Text style={styles.headerBotaoTexto}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.titulo}>Novo objeto perdido/encontrado</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome do objeto"
            placeholderTextColor="#777"
            value={nomeObjeto}
            onChangeText={setNomeObjeto}
            editable={!salvando}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descrição do item"
            placeholderTextColor="#777"
            multiline
            value={descricao}
            onChangeText={setDescricao}
            editable={!salvando}
          />

          <TextInput
            style={styles.input}
            placeholder="Local de encontro"
            placeholderTextColor="#777"
            value={localEncontro}
            onChangeText={setLocalEncontro}
            editable={!salvando}
          />

          <TextInput
            style={styles.input}
            placeholder="Data do encontro (AAAA-MM-DD)"
            placeholderTextColor="#777"
            value={dataEncontro}
            onChangeText={setDataEncontro}
            editable={!salvando}
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.label}>Categoria</Text>
          {carregandoCategorias ? (
            <View style={styles.carregandoCategoria}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.carregandoTexto}>Carregando categorias...</Text>
            </View>
          ) : (
            <View style={styles.opcoes}>
              {categorias.map((categoria) => (
                <TouchableOpacity
                  key={categoria.id_categoria}
                  style={[
                    styles.opcao,
                    idCategoria === categoria.id_categoria && styles.opcaoSelecionada,
                  ]}
                  onPress={() => setIdCategoria(categoria.id_categoria)}
                  disabled={salvando}
                >
                  <Text style={styles.icone}>{categoria.icone || "📦"}</Text>
                  <Text
                    style={[
                      styles.opcaoTexto,
                      idCategoria === categoria.id_categoria && styles.opcaoTextoSelecionado,
                    ]}
                  >
                    {categoria.nome_categoria}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Estado do objeto</Text>
          <View style={styles.opcoes}>
            {estados.map((estado) => (
              <TouchableOpacity
                key={estado.valor}
                style={[
                  styles.opcao,
                  estadoObjeto === estado.valor && styles.opcaoSelecionada,
                ]}
                onPress={() => setEstadoObjeto(estado.valor)}
                disabled={salvando}
              >
                <Text
                  style={[
                    styles.opcaoTexto,
                    estadoObjeto === estado.valor && styles.opcaoTextoSelecionado,
                  ]}
                >
                  {estado.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Status</Text>
          <View style={styles.opcoes}>
            {statusOpcoes.map((status) => (
              <TouchableOpacity
                key={status.valor}
                style={[
                  styles.opcao,
                  statusObjeto === status.valor && styles.opcaoSelecionada,
                ]}
                onPress={() => setStatusObjeto(status.valor)}
                disabled={salvando}
              >
                <Text
                  style={[
                    styles.opcaoTexto,
                    statusObjeto === status.valor && styles.opcaoTextoSelecionado,
                  ]}
                >
                  {status.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Foto do item</Text>
          <TouchableOpacity
            style={styles.fotoArea}
            onPress={adicionarFoto}
            disabled={salvando}
            activeOpacity={0.8}
          >
            {foto?.uri ? (
              <Image source={{ uri: foto.uri }} style={styles.fotoPreview} />
            ) : (
              <>
                <Text style={styles.fotoIcone}>📷</Text>
                <Text style={styles.fotoTexto}>Adicionar foto</Text>
              </>
            )}
          </TouchableOpacity>

          {foto?.uri ? (
            <TouchableOpacity
              onPress={() => setFoto(null)}
              disabled={salvando}
            >
              <Text style={styles.removerFoto}>Remover foto</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.botaoSalvar, salvando && styles.botaoDesabilitado]}
            onPress={cadastrarObjeto}
            disabled={salvando}
            activeOpacity={0.8}
          >
            {salvando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botaoSalvarTexto}>Salvar Item</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  header: {
    backgroundColor: "#2563eb",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitulo: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  headerBotao: {
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  headerBotaoTexto: { color: "#2563eb", fontWeight: "bold" },
  content: { padding: 20, paddingBottom: 40 },
  card: {
    width: "100%",
    maxWidth: 550,
    alignSelf: "center",
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 15,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  titulo: {
    textAlign: "center",
    color: "#1e3a8a",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
    color: "#222",
    backgroundColor: "#fff",
    fontSize: 14,
  },
  textArea: {
    height: 90,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  label: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 7,
  },
  carregandoCategoria: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  carregandoTexto: { color: "#6b7280", marginLeft: 8 },
  opcoes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  opcao: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 13,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
  },
  opcaoSelecionada: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  icone: { fontSize: 16, marginRight: 5 },
  opcaoTexto: { color: "#374151", fontSize: 13 },
  opcaoTextoSelecionado: { color: "#fff", fontWeight: "bold" },
  fotoArea: {
    width: "100%",
    height: 180,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    borderRadius: 10,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  fotoIcone: { fontSize: 32, marginBottom: 7 },
  fotoTexto: { color: "#4b5563", fontWeight: "600" },
  fotoPreview: { width: "100%", height: "100%", resizeMode: "cover" },
  removerFoto: {
    textAlign: "center",
    color: "#ef4444",
    fontWeight: "bold",
    marginTop: 10,
  },
  botaoSalvar: {
    width: "100%",
    height: 48,
    marginTop: 20,
    borderRadius: 8,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  botaoDesabilitado: { backgroundColor: "#93c5fd" },
  botaoSalvarTexto: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
