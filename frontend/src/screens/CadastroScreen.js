import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { API_URL } from "../config/api";

function mensagemDeErro(codigo) {
  switch (codigo) {
    case "auth/invalid-email":
      return "Digite um e-mail válido.";
    case "auth/email-already-in-use":
      return "Esse e-mail já está em uso.";
    case "auth/weak-password":
      return "Senha muito fraca (mínimo 6 caracteres).";
    case "auth/network-request-failed":
      return "Sem conexão com a internet.";
    case "auth/operation-not-allowed":
      return "O cadastro por e-mail não está habilitado no Firebase.";
    default:
      return "Erro ao cadastrar.";
  }
}

export default function CadastroScreen({ onVoltar }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [turma, setTurma] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function cadastrar() {
    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();
    const turmaLimpa = turma.trim();

    if (!nomeLimpo || !emailLimpo || !senha || !turmaLimpa) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }

    if (senha.length < 6) {
      Alert.alert("Atenção", "A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setCarregando(true);

    try {
      const credencial = await createUserWithEmailAndPassword(
        auth,
        emailLimpo,
        senha
      );

      await updateProfile(credencial.user, {
        displayName: nomeLimpo,
      });

      try {
        const token = await credencial.user.getIdToken();
        const resposta = await fetch(`${API_URL}/usuarios`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: nomeLimpo,
            email: emailLimpo,
            turma: turmaLimpa,
          }),
        });

        if (!resposta.ok) {
          const dados = await resposta.json().catch(() => ({}));
          console.warn("Usuário criado no Firebase, mas não sincronizado no MySQL:", dados);
        }
      } catch (erroSincronizacao) {
        console.warn("Falha ao sincronizar usuário com o backend:", erroSincronizacao);
      }

      // O projeto de referência volta para o login após o cadastro.
      await signOut(auth);

      Alert.alert(
        "Conta criada com sucesso!",
        "Agora faça login para entrar no AchouNoIF.",
        [{ text: "OK", onPress: onVoltar }]
      );
    } catch (error) {
      console.error("Erro no cadastro:", error);
      Alert.alert("Erro", mensagemDeErro(error?.code));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.titulo}>Cadastrar Usuário</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome Completo"
              placeholderTextColor="#999"
              value={nome}
              onChangeText={setNome}
              editable={!carregando}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              editable={!carregando}
            />

            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={senha}
              onChangeText={setSenha}
              editable={!carregando}
            />

            <TextInput
              style={styles.input}
              placeholder="Turma"
              placeholderTextColor="#999"
              value={turma}
              onChangeText={setTurma}
              editable={!carregando}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={[styles.botao, carregando && styles.botaoDesabilitado]}
              onPress={cadastrar}
              disabled={carregando}
              activeOpacity={0.8}
            >
              {carregando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.textoBotao}>Cadastrar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoVoltar}
              onPress={onVoltar}
              disabled={carregando}
              activeOpacity={0.7}
            >
              <Text style={styles.textoVoltar}>← Voltar para o login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2563eb",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    padding: 35,
    borderRadius: 15,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e3a8a",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
    color: "#222",
    backgroundColor: "#fff",
  },
  botao: {
    width: "100%",
    height: 48,
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  botaoDesabilitado: { backgroundColor: "#93c5fd" },
  textoBotao: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  botaoVoltar: { marginTop: 15, alignItems: "center" },
  textoVoltar: { color: "#2563eb", fontSize: 14 },
});
