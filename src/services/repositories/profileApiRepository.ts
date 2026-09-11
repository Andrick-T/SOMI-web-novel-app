import { apiAuthRepository } from "./authRepository";

export type UserProfilePreferences = {
  notifications?: boolean;
  darkMode?: boolean;
  language?: string;
};

export type ProfileReadingGenre = {
  genre: string;
  pct: number;
};

export type ProfileResponse = {
  profile: {
    user: {
      id: string;
      email: string;
      username: string;
      role: string;
      status: string;
      createdAt: string;
    };
    profile: {
      displayName: string | null;
      avatar: string | null;
      bio: string | null;
      preferences: UserProfilePreferences;
    };
    wallet: {
      balance: number;
      currency: string;
    };
    stats: {
      booksRead: number;
      readingHours: number;
      dayStreak: number;
      averageRating: number | null;
    };
    readingGenres: ProfileReadingGenre[];
  };
};

export type UpdateProfileInput = {
  username?: string;
  displayName?: string | null;
  bio?: string | null;
  avatar?: string | null;
  preferences?: UserProfilePreferences;
};

class ProfileApiRepository {
  async getProfile(): Promise<ProfileResponse> {
    return apiAuthRepository.authorizedRequest<ProfileResponse>(
      "/api/v1/profile",
      {
        method: "GET",
      },
    );
  }

  async updateProfile(input: UpdateProfileInput): Promise<ProfileResponse> {
    return apiAuthRepository.authorizedRequest<ProfileResponse>(
      "/api/v1/profile",
      {
        method: "PATCH",
        body: JSON.stringify(input),
      },
    );
  }
}

export const profileApiRepository = new ProfileApiRepository();
