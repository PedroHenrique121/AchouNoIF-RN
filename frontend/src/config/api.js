import { Platform } from "react-native";

function normalizarUrl(url) {
  return String(url || "").trim().replace(/\/$/, "");
}

// A URL pode ser definida em EXPO_PUBLIC_API_URL no arquivo .env.
// Isso evita alterar o código quando o endereço local da API mudar.
const urlConfigurada = normalizarUrl(process.env.EXPO_PUBLIC_API_URL);

let API_URL = urlConfigurada;

if (!API_URL) {
  // Fallback apenas para desenvolvimento local.
  if (Platform.OS === "android") {
    // Android Emulator: 10.0.2.2 aponta para o localhost do computador.
    API_URL = "http://10.0.2.2:3000";
  } else {
    // iOS Simulator/Web: localhost funciona.
    API_URL = "http://localhost:3000";
  }
}

export { API_URL };
export const UPLOADS_URL = `${API_URL}/uploads`;

export function getFotoUrl(nomeArquivo) {
  if (!nomeArquivo) return null;

  if (nomeArquivo.startsWith("http://") || nomeArquivo.startsWith("https://")) {
    return nomeArquivo;
  }

  return `${UPLOADS_URL}/${encodeURIComponent(nomeArquivo)}`;
}
