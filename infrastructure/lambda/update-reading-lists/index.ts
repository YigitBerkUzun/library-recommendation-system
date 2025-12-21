import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

interface UpdateReadingListRequest {
  listId: string;
  userId?: string;
  name?: string;
  description?: string;
  bookIds?: string[];
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const body: UpdateReadingListRequest = JSON.parse(event.body || '{}');
    const listId = event.pathParameters?.id;

    if (!listId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'List ID is required in path' }),
      };
    }

    const userId = body.userId || '1';

    const command = new UpdateCommand({
      TableName: process.env.READING_LISTS_TABLE_NAME,
      Key: {
        id: listId,
        userId: userId,
      },
      UpdateExpression: `
        SET #name = :name,
            description = :desc,
            bookIds = :bookIds,
            updatedAt = :updatedAt
      `,
      ExpressionAttributeNames: {
        '#name': 'name', // "name" DynamoDB reserved word
      },
      ExpressionAttributeValues: {
        ':name': body.name,
        ':desc': body.description || '',
        ':bookIds': body.bookIds || [],
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    });

    const response = await docClient.send(command);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(response.Attributes),
    };
  } catch (error) {
    console.error('Error updating reading list:', error);

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Failed to update reading list' }),
    };
  }
};