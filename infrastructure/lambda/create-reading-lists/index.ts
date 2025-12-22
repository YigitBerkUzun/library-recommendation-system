import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import{randomUUID} from 'crypto';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,',
};

interface CreateReadingListRequest{
    userId?: string;
    name: string;
    description?: string;
    bookIds?:string[];
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event: ', JSON.stringify(event, null, 2));
  
  try {
    const body: CreateReadingListRequest = JSON.parse(event.body || '{}');
;
    if (!body.name || body.name.trim() === '') {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'List name is required' }),
      };
    }

    // Generate unique ID and get userId (from auth context or default)

    const userId = body.userId || '1';
    const createdAt = new Date().toISOString();

    // Create reading list item
    const newList = {
      id: randomUUID(),
      userId: userId,
      name: body.name,
      description: body.description || '',
      bookIds: body.bookIds || [],
      createdAt,
      updatedAt: createdAt,
    };

    // Save to DynamoDB
    const command = new PutCommand({
      TableName: process.env.READING_LISTS_TABLE_NAME,
      Item: newList,
    });

    await docClient.send(command);

    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify(newList),
    };
  } catch (error) {
    console.error('Error creating reading list:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Failed to create reading list' }),
    };
  }
};