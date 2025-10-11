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
        throw new Error(`n8n training failed: ${response.statusText}`);
      }

      const result = await response.json();
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
   */
  static async sendChatMessage(payload: ChatPayload): Promise<{ success: boolean; response?: string; message?: string }> {
    try {
      if (!this.n8nWebhookUrl) {
        console.warn('N8N_WEBHOOK_URL not configured');
        return { success: false, message: 'n8n not configured' };
      }

      // Use the webhook endpoint from the n8n workflow
      const chatWebhookUrl = this.n8nWebhookUrl.replace('/training', '/chat');

      const response = await fetch(chatWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: {
            message: payload.message,
            chat_id: payload.chatId,
            bot_id: payload.botId,
            user_id: payload.userId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`n8n chat failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ n8n chat response:', result);

      return {
        success: true,
        response: result.Response || result.response || 'No response from bot'
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
