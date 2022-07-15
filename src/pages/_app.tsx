import type { AppProps } from "next/app";

import "@fortawesome/fontawesome-free/css/all.css";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
