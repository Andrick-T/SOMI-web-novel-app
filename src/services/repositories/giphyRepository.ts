import { appConfig } from "../../config/env";

const GIPHY_API_BASE_URL = "https://api.giphy.com/v1/gifs";

const DEFAULT_LIMIT = 24;
const MAX_SEARCH_LENGTH = 50;

export type GiphyRendition = {
  url: string;
  width: string;
  height: string;
  size?: string;
};

export type GiphyGif = {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  previewWidth: string;
  previewHeight: string;
};

type GiphyApiImage = {
  url?: string;
  width?: string;
  height?: string;
  size?: string;
};

type GiphyApiGif = {
  id: string;
  title?: string;
  url?: string;
  images?: {
    fixed_width_small?: GiphyApiImage;
    fixed_width?: GiphyApiImage;
    downsized_medium?: GiphyApiImage;
  };
};

type GiphyApiResponse = {
  data: GiphyApiGif[];
  pagination?: {
    total_count?: number;
    count?: number;
    offset?: number;
  };
  meta?: {
    status?: number;
    msg?: string;
  };
};

const getApiKey = () => {
  const apiKey = appConfig.giphyApiKey.trim();

  if (!apiKey) {
    throw new Error(
      "GIPHY API key is not configured. Add VITE_GIPHY_API_KEY to your .env file.",
    );
  }

  return apiKey;
};

const mapGif = (gif: GiphyApiGif): GiphyGif | null => {
  const preview = gif.images?.fixed_width_small;
  const selected = gif.images?.downsized_medium;

  if (!preview?.url || !selected?.url) {
    return null;
  }

  return {
    id: gif.id,
    title: gif.title ?? "",
    url: selected.url,
    previewUrl: preview.url,
    previewWidth: preview.width ?? "0",
    previewHeight: preview.height ?? "0",
  };
};

const requestGiphy = async (endpoint: string): Promise<GiphyGif[]> => {
  const apiKey = getApiKey();

  const separator = endpoint.includes("?") ? "&" : "?";

  const response = await fetch(
    `${GIPHY_API_BASE_URL}${endpoint}${separator}api_key=${encodeURIComponent(apiKey)}&rating=g`,
  );

  if (!response.ok) {
    throw new Error(`GIPHY request failed with status ${response.status}.`);
  }

  const result = (await response.json()) as GiphyApiResponse;

  if (result.meta?.status && result.meta.status >= 400) {
    throw new Error(result.meta.msg ?? "GIPHY request failed.");
  }

  return result.data.map(mapGif).filter((gif): gif is GiphyGif => gif !== null);
};

export const giphyRepository = {
  async trending(offset = 0, limit = DEFAULT_LIMIT) {
    return requestGiphy(`/trending?limit=${limit}&offset=${offset}`);
  },

  async search(query: string, offset = 0, limit = DEFAULT_LIMIT) {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return this.trending(offset, limit);
    }

    if (normalizedQuery.length > MAX_SEARCH_LENGTH) {
      throw new Error("GIPHY search cannot exceed 50 characters.");
    }

    return requestGiphy(
      `/search?q=${encodeURIComponent(
        normalizedQuery,
      )}&limit=${limit}&offset=${offset}`,
    );
  },
};
