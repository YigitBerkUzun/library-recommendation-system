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
    console.log('Raw body:', event.body);
    
    if (!event.body) {
      console.log('No body provided');
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const body: CreateReadingListRequest = JSON.parse(event.body);
    console.log('Parsed body:', JSON.stringify(body, null, 2));
    
    if (!body.name || body.name.trim() === '') {
      console.log('Name validation failed');
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'List name is required' }),
      };
    }

    const userId = body.userId || '1';
    const createdAt = new Date().toISOString();
    const id = randomUUID();

    console.log('Generated ID:', id);
    console.log('Table name:', process.env.READING_LISTS_TABLE_NAME);

    // Create reading list item
    const newList = {
      id: id,
      userId: userId,
      name: body.name,
      description: body.description || '',
      bookIds: body.bookIds || [],
      createdAt,
      updatedAt: createdAt,
    };

    console.log('Item to save:', JSON.stringify(newList, null, 2));

    // Save to DynamoDB
    const command = new PutCommand({
      TableName: process.env.READING_LISTS_TABLE_NAME,
      Item: newList,
    });

    console.log('Sending command to DynamoDB...');
    await docClient.send(command);
    console.log('Successfully saved to DynamoDB');

    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify(newList),
    };
  } catch (error) {
    console.error('Error creating reading list:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        error: 'Failed to create reading list',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};