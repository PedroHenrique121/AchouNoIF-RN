import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./src/config/firebase";

import CadastroScreen from "./src/screens/CadastroScreen";
import EsqueciSenhaScreen from "./src/screens/EsqueciSenhaScreen";
import HomeScreen from "./src/screens/HomeScreen";
import CriarObjetoScreen from "./src/screens/CriarObjetoScreen";
import LoginScreen from "./src/screens/LoginScreen";

export default function App() {
  const [user, setUser] = useState(undefined);
  const [tela, setTela] = useState("login");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (usuario) => {
        setUser(usuario);
      }
    );

    return unsubscribe;
  }, []);

  // Verificando o estado do Firebase
  if (user === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#2563eb"
        />
      </View>
    );
  }

  // Usuário está logado
  if (user) {
    if (tela === "criarObjeto") {
      return (
        <CriarObjetoScreen
          onVoltar={() => setTela("home")}
          navigation={{
            goBack: () => setTela("home"),
          }}
        />
      );
    }

    return (
      <HomeScreen
        user={user}
        onCriarObjeto={() => setTela("criarObjeto")}
      />
    );
  }

  // Tela de cadastro
  if (tela === "cadastro") {
    return (
      <CadastroScreen
        onVoltar={() => setTela("login")}
      />
    );
  }

  // Tela de recuperação de senha
  if (tela === "esqueciSenha") {
    return (
      <EsqueciSenhaScreen
        onVoltar={() => setTela("login")}
      />
    );
  }

  // Tela de login
  return (
    <LoginScreen
      onCadastrar={() => setTela("cadastro")}
      onEsqueciSenha={() => setTela("esqueciSenha")}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});