import Cookies from "js-cookie";

export const refreshIdToken = async () => {
  try {
    const refreshToken = Cookies.get("refreshToken");
    if (!refreshToken) return null;

    const res = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
      }
    );

    const data = await res.json();
    if (data.id_token && data.refresh_token) {
      Cookies.set("idToken", data.id_token, { expires: 1 / 24 });
      Cookies.set("refreshToken", data.refresh_token, { expires: 30 });
      return data.id_token;
    }
    return null;
  } catch (err) {
    console.error("Error refreshing token:", err);
    return null;
  }
};
