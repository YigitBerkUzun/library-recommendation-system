import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

export const handler = async(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Event: ',JSON.stringify(event,null,2));

    try{
        const bookId = event.pathParameters?.id;
        if(!bookId) {
            return {
                statusCode:400,
                headers: CORS_HEADERS,
                body: JSON.stringify({error: 'Book ID is required'})
            }
        }

        const command = new GetCommand({
            TableName: process.env.BOOKS_TABLE_NAME,
            Key:{id:bookId},

        });
        const response = await docClient.send(command);
        if(!response.Item) {
            return{
                statusCode: 404,
                headers: CORS_HEADERS,
                body: JSON.stringify({error: 'Book not found'})
            }
        }
        return {
            statusCode:200,
            headers: CORS_HEADERS,
            body: JSON.stringify(response.Item),
        }
    } catch (error) {
        console.error('Error fetching book: ',error);
        return {
            statusCode:500,
            headers: CORS_HEADERS,
            body: JSON.stringify({error: 'Failed to fetch the book.'}),
        }
    }
}
