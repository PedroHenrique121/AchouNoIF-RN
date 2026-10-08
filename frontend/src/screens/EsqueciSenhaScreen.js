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
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";

function mensagemDeErro(codigo) {
  switch (codigo) {
    case "auth/invalid-email":
      return "Digite um e-mail válido.";
    case "auth/user-not-found":
      return "Não encontramos uma conta com esse e-mail.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Tente novamente mais tarde.";
    case "auth/network-request-failed":
      return "Sem conexão com a internet.";
    default:
      return "Erro ao enviar e-mail.";
  }
}

export default function EsqueciSenhaScreen({ onVoltar }) {
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function recuperarSenha() {
    const emailLimpo = email.trim().toLowerCase();

    if (!emailLimpo) {
      Alert.alert("Atenção", "Digite seu email.");
      return;
    }

    setCarregando(true);

    try {
      await sendPasswordResetEmail(auth, emailLimpo);
      Alert.alert(
        "Link enviado!",
        "Verifique sua caixa de entrada para redefinir sua senha.",
        [{ text: "OK", onPress: onVoltar }]
      );
      setEmail("");
    } catch (error) {
      console.error("Erro ao recuperar senha:", error);
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
            <Text style={styles.titulo}>Recuperar Senha</Text>

            <TextInput
              style={styles.input}
              placeholder="Digite seu email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              editable={!carregando}
              onSubmitEditing={recuperarSenha}
            />

            <TouchableOpacity
              style={[styles.botao, carregando && styles.botaoDesabilitado]}
              onPress={recuperarSenha}
              disabled={carregando}
              activeOpacity={0.8}
            >
              {carregando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.textoBotao}>Enviar Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoVoltar}
              onPress={onVoltar}
              disabled={carregando}
              activeOpacity={0.8}
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
    marginVertical: 10,
    color: "#222",
    backgroundColor: "#fff",
  },
  botao: {
    width: "100%",
    height: 48,
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
