// pages/_document.js

import Document, { Html, Head, Main, NextScript } from 'next/document';
import crypto from 'crypto';

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    // Generate a random nonce for this request
    const nonce = crypto.randomBytes(16).toString('base64');
    
    // Get the initial props from the default Document class
    const initialProps = await Document.getInitialProps(ctx);

    return {
      ...initialProps,
      nonce, // Add nonce to the props to be used in the document
    };
  }

  render() {
    const { nonce } = this.props; // Access the nonce generated on the server

    return (
      <Html>
        <Head>
          {/* Add the nonce to the Content-Security-Policy header */}
          <meta
            httpEquiv="Content-Security-Policy"
            content={`default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline';`}
          />
          {/* You can also include inline scripts with the nonce */}
          <script
            nonce={nonce}
            dangerouslySetInnerHTML={{
              __html: `console.log('This is a secure inline script executed safely')`,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
