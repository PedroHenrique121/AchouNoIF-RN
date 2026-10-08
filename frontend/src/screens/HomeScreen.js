import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { API_URL, getFotoUrl } from "../config/api";

const statusLabel = {
  perdido: "Perdido",
  entregue: "Encontrado",
};

function textoStatus(status) {
  return statusLabel[status] || status || "Sem status";
}

export default function HomeScreen({ user, onCriarObjeto }) {
  const [itens, setItens] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [statusSelecionado, setStatusSelecionado] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const { width } = useWindowDimensions();
  const duasColunas = width >= 600;

  const carregarDados = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true);
    setErro("");

    try {
      const [resItens, resCategorias] = await Promise.all([
        fetch(`${API_URL}/itens`),
        fetch(`${API_URL}/categorias`),
      ]);

      const dadosItens = await resItens.json().catch(() => []);
      const dadosCategorias = await resCategorias.json().catch(() => []);

      if (!resItens.ok) {
        throw new Error(dadosItens?.erro || "Erro ao carregar os itens.");
      }

      setItens(Array.isArray(dadosItens) ? dadosItens : []);
      setCategorias(
        Array.isArray(dadosCategorias) ? dadosCategorias : []
      );
    } catch (error) {
      console.error("Erro ao carregar Home:", error);
      setErro("Erro ao carregar itens do servidor.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  async function sair() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  }

  const itensFiltrados = useMemo(() => {
    const texto = busca.trim().toLowerCase();

    return itens.filter((item) => {
      const nome = String(item.nome_objeto || "").toLowerCase();
      const descricao = String(item.descricao || "").toLowerCase();
      const categoria = String(item.nome_categoria || "");
      const status = textoStatus(item.status_objeto);

      const matchTexto =
        !texto || nome.includes(texto) || descricao.includes(texto);
      const matchCategoria =
        !categoriaSelecionada || categoria === categoriaSelecionada;
      const matchStatus = !statusSelecionado || status === statusSelecionado;

      return matchTexto && matchCategoria && matchStatus;
    });
  }, [busca, categoriaSelecionada, statusSelecionado, itens]);

  const categoriasExibidas = useMemo(() => {
    const nomesDoBanco = categorias
      .map((categoria) => categoria.nome_categoria)
      .filter(Boolean);

    if (nomesDoBanco.length) return nomesDoBanco;

    return [
      "Material Escolar",
      "Eletrônicos",
      "Roupas",
      "Mochilas",
      "Acessórios",
    ];
  }, [categorias]);

  function renderItem({ item }) {
    const status = textoStatus(item.status_objeto);
    const fotoUrl = getFotoUrl(item.foto_principal);

    return (
      <View style={[styles.cardItem, duasColunas && styles.cardDuasColunas]}>
        {fotoUrl ? (
          <Image
            source={{ uri: fotoUrl }}
            style={styles.imagem}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.semFoto}>
            <Text style={styles.semFotoIcon}>📦</Text>
            <Text style={styles.semFotoTexto}>Sem foto</Text>
          </View>
        )}

        <Text style={styles.nomeItem} numberOfLines={2}>
          {item.nome_objeto || "Objeto sem nome"}
        </Text>

        <Text style={styles.descricao} numberOfLines={2}>
          {item.descricao || "Sem descrição"}
        </Text>

        <View
          style={[
            styles.status,
            item.status_objeto === "entregue"
              ? styles.statusEncontrado
              : styles.statusPerdido,
          ]}
        >
          <Text style={styles.statusTexto}>{status}</Text>
        </View>

        <Text style={styles.categoria} numberOfLines={1}>
          Categoria: {item.nome_categoria || "Sem categoria"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>AcheiNoIF</Text>
        <TouchableOpacity style={styles.botaoSair} onPress={sair} activeOpacity={0.8}>
          <Text style={styles.botaoSairTexto}>Sair</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        key={duasColunas ? "duas-colunas" : "uma-coluna"}
        data={itensFiltrados}
        renderItem={renderItem}
        keyExtractor={(item, index) => String(item.id_objeto ?? index)}
        numColumns={duasColunas ? 2 : 1}
        columnWrapperStyle={duasColunas ? styles.colunas : undefined}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              setAtualizando(true);
              carregarDados(true);
            }}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.info}>
              <Text style={styles.infoTexto}>
                🔔 Para retirar os itens perdidos, vá ao <Text style={styles.negrito}>Centro de Convivência</Text> na área dos funcionários.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.botaoAdicionar}
              onPress={onCriarObjeto}
              activeOpacity={0.8}
            >
              <Text style={styles.botaoAdicionarTexto}>＋ Cadastrar objeto</Text>
            </TouchableOpacity>

            <View style={styles.filtros}>
              <TextInput
                style={styles.inputBusca}
                placeholder="Pesquisar item..."
                placeholderTextColor="#6b7280"
                value={busca}
                onChangeText={setBusca}
              />

              <Text style={styles.tituloFiltro}>Categorias</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={["", ...categoriasExibidas]}
                keyExtractor={(item, index) => `${item}-${index}`}
                contentContainerStyle={styles.filtroHorizontal}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.pill,
                      categoriaSelecionada === item && styles.pillSelecionada,
                    ]}
                    onPress={() => setCategoriaSelecionada(item)}
                  >
                    <Text
                      style={[
                        styles.pillTexto,
                        categoriaSelecionada === item && styles.pillTextoSelecionado,
                      ]}
                    >
                      {item || "Todas Categorias"}
                    </Text>
                  </TouchableOpacity>
                )}
              />

              <Text style={styles.tituloFiltro}>Status</Text>
              <View style={styles.statusFiltros}>
                {["", "Perdido", "Encontrado"].map((item) => (
                  <TouchableOpacity
                    key={item || "todos"}
                    style={[
                      styles.pill,
                      statusSelecionado === item && styles.pillSelecionada,
                    ]}
                    onPress={() => setStatusSelecionado(item)}
                  >
                    <Text
                      style={[
                        styles.pillTexto,
                        statusSelecionado === item && styles.pillTextoSelecionado,
                      ]}
                    >
                      {item || "Todos Status"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {carregando && (
              <View style={styles.estadoInicial}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.estadoTexto}>Carregando itens...</Text>
              </View>
            )}

            {!carregando && erro ? (
              <View style={styles.estadoInicial}>
                <Text style={styles.erroTexto}>{erro}</Text>
                <TouchableOpacity
                  style={styles.tentarNovamente}
                  onPress={() => carregarDados()}
                >
                  <Text style={styles.tentarTexto}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !carregando && !erro ? (
            <Text style={styles.semResultados}>Nenhum item encontrado.</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  header: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  botaoSair: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  botaoSairTexto: { color: "#fff", fontWeight: "bold" },
  lista: { paddingBottom: 30 },
  info: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  infoTexto: {
    textAlign: "center",
    color: "#374151",
    fontSize: 14,
    lineHeight: 20,
  },
  negrito: { fontWeight: "bold" },
  botaoAdicionar: {
    margin: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#2563eb",
    alignItems: "center",
  },
  botaoAdicionarTexto: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  filtros: { paddingHorizontal: 16, paddingBottom: 10 },
  inputBusca: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#111827",
  },
  tituloFiltro: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    marginTop: 14,
    marginBottom: 8,
  },
  filtroHorizontal: { gap: 8, paddingRight: 16 },
  statusFiltros: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
  },
  pillSelecionada: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  pillTexto: { color: "#374151", fontSize: 13 },
  pillTextoSelecionado: { color: "#fff", fontWeight: "bold" },
  colunas: { gap: 16, paddingHorizontal: 16 },
  cardItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 16,
    marginTop: 16,
    paddingBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardDuasColunas: {
    flex: 1,
    marginHorizontal: 0,
    maxWidth: "50%",
  },
  imagem: {
    width: "100%",
    height: 170,
    backgroundColor: "#e2e8f0",
  },
  semFoto: {
    height: 170,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  semFotoIcon: { fontSize: 42 },
  semFotoTexto: { color: "#6b7280", marginTop: 4 },
  nomeItem: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 5,
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  descricao: {
    marginHorizontal: 12,
    color: "#4b5563",
    fontSize: 14,
    minHeight: 36,
  },
  status: {
    alignSelf: "flex-start",
    marginHorizontal: 12,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPerdido: { backgroundColor: "#ef4444" },
  statusEncontrado: { backgroundColor: "#22c55e" },
  statusTexto: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  categoria: {
    marginHorizontal: 12,
    marginTop: 9,
    color: "#6b7280",
    fontSize: 12,
  },
  estadoInicial: {
    alignItems: "center",
    paddingVertical: 22,
  },
  estadoTexto: { color: "#6b7280", marginTop: 8 },
  erroTexto: { color: "#ef4444", textAlign: "center" },
  tentarNovamente: {
    marginTop: 10,
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  tentarTexto: { color: "#fff", fontWeight: "bold" },
  semResultados: {
    textAlign: "center",
    color: "#6b7280",
    paddingVertical: 25,
    paddingHorizontal: 16,
  },
});
