import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as common from 'oci-common';
import * as genai from 'oci-generativeaiinference';

import { env } from './env';

let cachedClient: genai.GenerativeAiInferenceClient | null = null;

function resolveConfigFilePath(filePath: string): string {
  if (filePath.startsWith('~/') || filePath.startsWith('~\\')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

export function getOciInferenceClient(): genai.GenerativeAiInferenceClient | null {
  if (!env.OCI_ENABLED) {
    return null;
  }

  if (cachedClient) {
    return cachedClient;
  }

  try {
    let provider: common.AuthenticationDetailsProvider;

    // Check if direct credentials and private key content/path are provided
    const privateKeyRaw = env.OCI_PRIVATE_KEY || process.env['key_file'];
    let privateKeyContent = '';
    if (privateKeyRaw) {
      if (fs.existsSync(privateKeyRaw)) {
        privateKeyContent = fs.readFileSync(privateKeyRaw, 'utf8');
      } else if (
        privateKeyRaw.includes('BEGIN PRIVATE KEY') ||
        privateKeyRaw.includes('BEGIN RSA PRIVATE KEY')
      ) {
        privateKeyContent = privateKeyRaw.replace(/\\n/g, '\n');
      }
    }

    if (env.OCI_USER_OCID && env.OCI_FINGERPRINT && env.OCI_TENANCY_OCID && privateKeyContent) {
      provider = new common.SimpleAuthenticationDetailsProvider(
        env.OCI_TENANCY_OCID,
        env.OCI_USER_OCID,
        env.OCI_FINGERPRINT,
        privateKeyContent,
        null,
        common.Region.fromRegionId(env.OCI_REGION || 'us-chicago-1'),
      );
    } else {
      // Fallback to OCI config file (default ~/.oci/config)
      const configPath = resolveConfigFilePath(env.OCI_CONFIG_FILE || '~/.oci/config');
      if (!fs.existsSync(configPath)) {
        console.warn(`[oci-client] OCI config file not found at ${configPath}.`);
        return null;
      }
      provider = new common.ConfigFileAuthenticationDetailsProvider(
        configPath,
        env.OCI_PROFILE || 'DEFAULT',
      );
    }

    const client = new genai.GenerativeAiInferenceClient({
      authenticationDetailsProvider: provider,
    });

    const region = env.OCI_REGION || 'us-chicago-1';
    client.endpoint = `https://inference.generativeai.${region}.oci.oraclecloud.com`;

    cachedClient = client;
    return client;
  } catch (error) {
    console.error('[oci-client] Error initializing OCI Generative AI client:', error);
    return null;
  }
}

export interface OciChatRequestOptions {
  message: string;
  compartmentId?: string | undefined;
  modelId?: string | undefined;
  systemPrompt?: string | undefined;
  maxTokens?: number | undefined;
  temperature?: number | undefined;
}

export async function callOciCohereChat(options: OciChatRequestOptions): Promise<string> {
  const client = getOciInferenceClient();
  if (!client) {
    throw new Error(
      'OCI Generative AI client could not be initialized. Verify ~/.oci/config or OCI environment variables.',
    );
  }

  const compartmentId =
    options.compartmentId || env.OCI_COMPARTMENT_ID || process.env['OCI_COMPARTMENT_ID'];
  if (!compartmentId) {
    throw new Error('OCI_COMPARTMENT_ID is required to execute OCI Generative AI inference.');
  }

  const modelId = options.modelId || env.OCI_MODEL_ID || 'cohere.command-a-03-2025';

  const chatDetails: genai.models.ChatDetails = {
    compartmentId,
    servingMode: {
      servingType: 'ON_DEMAND',
      modelId,
    },
    chatRequest: {
      apiFormat: 'COHERE',
      message: options.message,
      preambleOverride: options.systemPrompt,
      maxTokens: options.maxTokens ?? 1000,
      temperature: options.temperature ?? 0.7,
    },
  };

  const response = await client.chat({
    chatDetails,
  });

  const chatResult = (response as { chatResult?: Record<string, unknown> })?.chatResult;
  const chatResponse = chatResult?.['chatResponse'] as
    { text?: string; message?: { content?: Array<{ text?: string }> | string } } | undefined;
  const directText =
    chatResponse?.text ||
    (Array.isArray(chatResponse?.message?.content)
      ? chatResponse?.message?.content[0]?.text
      : chatResponse?.message?.content) ||
    chatResult?.['text'];
  if (!directText) {
    console.error('[oci-client] Raw chatResult payload:', JSON.stringify(chatResult));
    throw new Error('Invalid response received from OCI Cohere Chat API.');
  }
  return typeof directText === 'string' ? directText : JSON.stringify(directText);
}
