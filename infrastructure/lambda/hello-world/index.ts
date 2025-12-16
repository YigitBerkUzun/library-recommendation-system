import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Event received: '+ JSON.stringify(event));

    return{
        statusCode:200,
        headers:{
            'Content-Type':'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
        },
        body: JSON.stringify({
            message: 'Hello from USA to Turkiye',
            timeStamp: new Date().toISOString(),
            path: event.path,
            method: event.httpMethod
        })
    };
};
