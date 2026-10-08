import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
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
import { auth } from "../config/firebase";

function mensagemDeErro(codigo) {
  switch (codigo) {
    case "auth/invalid-email":
      return "Digite um e-mail válido.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha inválidos.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Tente novamente mais tarde.";
    case "auth/network-request-failed":
      return "Sem conexão com a internet.";
    case "auth/user-disabled":
      return "Esta conta está desativada.";
    default:
      return "Erro ao fazer login.";
  }
}

export default function LoginScreen({
  onLoginSuccess,
  onCadastrar,
  onEsqueciSenha,
}) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function fazerLogin() {
    const emailLimpo = email.trim().toLowerCase();

    if (!emailLimpo || !senha) {
      Alert.alert("Atenção", "Preencha o e-mail e a senha.");
      return;
    }

    setCarregando(true);

    try {
      const credencial = await signInWithEmailAndPassword(
        auth,
        emailLimpo,
        senha
      );

      onLoginSuccess?.(credencial.user);
    } catch (error) {
      console.error("Erro Firebase:", error);
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
            <Text style={styles.titulo}>Achados e Perdidos</Text>

            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
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
              autoComplete="password"
              value={senha}
              onChangeText={setSenha}
              editable={!carregando}
              onSubmitEditing={fazerLogin}
            />

            <TouchableOpacity
              style={[styles.botao, carregando && styles.botaoDesabilitado]}
              onPress={fazerLogin}
              disabled={carregando}
              activeOpacity={0.8}
            >
              {carregando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.textoBotao}>Entrar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoCadastro}
              onPress={onCadastrar}
              disabled={carregando}
              activeOpacity={0.8}
            >
              <Text style={styles.textoCadastro}>Criar Conta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoEsqueciSenha}
              onPress={onEsqueciSenha}
              disabled={carregando}
              activeOpacity={0.8}
            >
              <Text style={styles.textoEsqueciSenha}>
                Esqueci minha senha
              </Text>
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
    fontSize: 22,
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
  botaoCadastro: {
    width: "100%",
    height: 48,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
  },
  textoCadastro: { color: "#2563eb", fontSize: 16, fontWeight: "bold" },
  botaoEsqueciSenha: {
    marginTop: 14,
    alignItems: "center",
  },
  textoEsqueciSenha: { color: "#2563eb", fontSize: 14 },
});
