import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,',
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event: ', JSON.stringify(event, null, 2));
    const userId = event.queryStringParameters?.userId || '1';
    try{
    // Since userId is the range key, we need to scan with a filter instead of query
    const command = new ScanCommand({
    TableName: process.env.READING_LISTS_TABLE_NAME,
    FilterExpression: 'userId = :userId',
    ExpressionAttributeValues: {
        ':userId': userId,
    },
    });
    

     const response = await docClient.send(command);


       return {
            statusCode:200,
            headers: CORS_HEADERS,
            body: JSON.stringify(response.Items || []),
        }
    } catch (error) {
        console.error('Error fetching reading lists: ',error);
        return {
            statusCode:500,
            headers: CORS_HEADERS,
            body: JSON.stringify({error: 'Failed to fetch reading lists.'}),
             };
        }
    };

