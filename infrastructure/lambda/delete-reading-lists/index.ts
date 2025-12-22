import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const listId = event.pathParameters?.id;

    if (!listId) {
      return {
        statusCode: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'List ID is required in path' }),
      };
    }

    const userId = event.queryStringParameters?.userId || '1';

    const command = new DeleteCommand({
      TableName: process.env.READING_LISTS_TABLE_NAME,
      Key: {
        id: listId,
        userId: userId,
      },
    });

    await docClient.send(command);

    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  } catch (error) {
    console.error('Error deleting reading list:', error);

    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to delete reading list' }),
    };
  }
};