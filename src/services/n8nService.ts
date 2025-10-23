/**
 * n8n Integration Service
 * Handles communication with n8n workflow for bot training
 */

interface TrainingPayload {
  botId: string;
  botName: string;
  documentId: string;
  documentName: string;
  documentContent: string;
  documentType: string;
  action: 'train' | 'retrain' | 'remove';
}

interface ChatPayload {
  botId: string;
  chatId: string;
  message: string;
  userId: string;
}

export class N8nService {
  private static n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || '';
  private static n8nApiKey = process.env.N8N_API_KEY || '';

  /**
   * Send document to n8n for training
   */
  static async trainBot(payload: TrainingPayload): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.n8nWebhookUrl) {
        console.warn('N8N_WEBHOOK_URL not configured, skipping training');
        return { success: false, message: 'n8n not configured' };
      }

      const response = await fetch(this.n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.n8nApiKey}`,
        },
        body: JSON.stringify({
          type: 'training',
          ...payload,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ n8n training failed (${response.status}):`, errorText);
        throw new Error(`n8n training failed: ${response.statusText}`);
      }

      // Handle empty or non-JSON responses from n8n
      const contentType = response.headers.get('content-type');
      let result: any = {};

      if (contentType && contentType.includes('application/json')) {
        const responseText = await response.text();
        if (responseText.trim()) {
          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            console.warn('⚠️ n8n returned invalid JSON:', responseText);
            result = { raw: responseText };
          }
        } else {
          console.warn('⚠️ n8n returned empty response body');
        }
      } else {
        const responseText = await response.text();
        console.warn('⚠️ n8n returned non-JSON response:', responseText);
        result = { raw: responseText };
      }

      console.log('✅ n8n training triggered:', result);

      return { success: true, message: 'Training initiated successfully' };
    } catch (error) {
      console.error('❌ Error triggering n8n training:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send chat message to trained bot
   * Message structure per Keys PDF:
   * { "chat_id": "c123", "message": "Give me a summary of my document" }
   */
  static async sendChatMessage(payload: ChatPayload): Promise<{ success: boolean; response?: string; message?: string }> {
    try {
      if (!this.n8nWebhookUrl) {
        console.warn('N8N_WEBHOOK_URL not configured');
        return { success: false, message: 'n8n not configured' };
      }

      // Send to same webhook URL (no /chat or /training suffix)
      // Message structure per Saas_AI_Chatbot_Keys.pdf
      const response = await fetch(this.n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: payload.chatId,
          message: payload.message,
          bot_id: payload.botId, // For n8n workflow routing
          filter_bot_id: payload.botId, // For Supabase Vector Store function parameter
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ n8n chat failed (${response.status}):`, errorText);
        throw new Error(`n8n chat failed: ${response.statusText}`);
      }

      // Handle empty or non-JSON responses from n8n
      const contentType = response.headers.get('content-type');
      let result: any = {};

      if (contentType && contentType.includes('application/json')) {
        const responseText = await response.text();
        if (responseText.trim()) {
          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            console.warn('⚠️ n8n returned invalid JSON:', responseText);
            // Treat the response text as the bot's reply
            return { success: true, response: responseText };
          }
        } else {
          console.warn('⚠️ n8n returned empty response body');
          return { success: false, message: 'Empty response from n8n' };
        }
      } else {
        const responseText = await response.text();
        console.warn('⚠️ n8n returned non-JSON response:', responseText);
        // Treat the response text as the bot's reply
        return { success: true, response: responseText };
      }

      console.log('✅ n8n chat response:', result);

      // FIX: n8n can return either an array or an object
      // Array format: [{"Response": "..."}]
      // Object format: {"response": "..."}
      let responseText;

      if (Array.isArray(result) && result.length > 0) {
        // Handle array format - take first item
        responseText = result[0].Response || result[0].response || result[0].output || result[0].text;
      } else {
        // Handle object format
        responseText = result.Response || result.response || result.output || result.text;
      }

      if (!responseText) {
        console.error('❌ n8n response missing expected fields:', JSON.stringify(result, null, 2));
        return {
          success: false,
          message: 'No response field found in n8n output'
        };
      }

      return {
        success: true,
        response: responseText
      };
    } catch (error) {
      console.error('❌ Error sending chat to n8n:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Batch train multiple documents
   */
  static async batchTrainBot(
    botId: string,
    botName: string,
    documents: Array<{ id: string; name: string; content: string; type: string }>
  ): Promise<{ success: boolean; message: string; results: Array<{ documentId: string; success: boolean }> }> {
    const results = [];

    for (const doc of documents) {
      const result = await this.trainBot({
        botId,
        botName,
        documentId: doc.id,
        documentName: doc.name,
        documentContent: doc.content,
        documentType: doc.type,
        action: 'train',
      });

      results.push({
        documentId: doc.id,
        success: result.success,
      });

      // Small delay to avoid overwhelming n8n
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const successCount = results.filter(r => r.success).length;

    return {
      success: successCount === documents.length,
      message: `Trained ${successCount}/${documents.length} documents`,
      results,
    };
  }

  /**
   * Remove document training from bot
   */
  static async removeDocumentTraining(
    botId: string,
    botName: string,
    documentId: string,
    documentName: string
  ): Promise<{ success: boolean; message: string }> {
    return this.trainBot({
      botId,
      botName,
      documentId,
      documentName,
      documentContent: '',
      documentType: '',
      action: 'remove',
    });
  }

  /**
   * Retrain bot with updated document
   */
  static async retrainBot(payload: Omit<TrainingPayload, 'action'>): Promise<{ success: boolean; message: string }> {
    return this.trainBot({
      ...payload,
      action: 'retrain',
    });
  }
}
