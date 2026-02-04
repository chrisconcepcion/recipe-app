# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

### Google Auth Setup (Required)
To run this app, you must configure a Google Cloud Project for authentication and storage.

1.  **Create a Project**: Go to [Google Cloud Console](https://console.cloud.google.com/) and create a new project.
2.  **Enable APIs**: Enable the **Google Drive API** (for storage).
3.  **OAuth Consent Screen**: Configure the OAuth consent screen.
    *   **User Type**: External (or Internal if G-Suite).
    *   **Scopes**: Add `.../auth/drive.file`, `email`, `profile`, `openid`.
    *   **Test Users**: Add your email if in "Testing" mode.
4.  **Credentials**: Create OAuth 2.0 Client IDs.
    *   **Web Client**: Required for Expo development.
        *   *Authorized JavaScript origins*:
            *   For local web testing: `http://localhost:8081`
            *   For Expo Go proxy (optional): `https://auth.expo.io`
        *   *Authorized redirect URIs*: 
            *   `https://auth.expo.io/@your-username/recipe` (if using Expo Go)
            *   `http://localhost:8081` (for local web)
    *   **iOS/Android**: Create if building native binaries.
5.  **Configure App**:
    *   Open `contexts/AuthContext.tsx`.
    *   Replace `CLIENT_IDS.web` (and others) with your new Client IDs.

### Run the App

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
