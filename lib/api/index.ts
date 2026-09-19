export { api, apiRequest, listAll, login, logout, loadSession, saveSession, fetchMoi, fetchImpayes, fetchTableauDeBordDirection, ApiError } from "./client";
export type {
  AuthSession,
  Moi,
  FactureImpayee,
  TableauDeBordDirection,
  BlocProduction,
  BlocStock,
  BlocCommercial,
  BlocCaisse,
  BlocDistribution,
  BlocRentabilite,
  BlocAlertes,
  ProduitRentable,
} from "./client";
export { actions, catalog, catalogKeysForRole, detail, endpoints } from "./resources";
export type { CatalogKey, EndpointKey } from "./resources";
