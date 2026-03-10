// BACKEND: restore this later — original backend/auth routes
// export const ALL_ROUTES = {
//   REGISTER: `/register`,
//   LOGIN: `/login`,
//   HOME: "/",
//   UPLOAD_DOC: "/upload-doc",
//   DOC_LIST: "/bots",
//   CHAT: "/chat/:botId",
//   MY_PROFILE: "/my-profile",
//   PUBLIC: "/public/:botId",
// };

// NEXUS AI — Frontend-only routes
export const NEXUS_ROUTES = {
  HOME: "/",
  CHAT: "/chat",
  CODE: "/code",
  EXAM: "/exam",
  EXPLORE: "/explore",
  SETTINGS: "/settings",
};

// Re-export as ALL_ROUTES for any legacy references that may remain
export const ALL_ROUTES = NEXUS_ROUTES;
