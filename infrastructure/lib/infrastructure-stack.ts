import * as cdk from 'aws-cdk-lib/core';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Cognito User Pool for authentication
    const userPool = new cognito.UserPool(this, 'LibraryUserPool', {
      userPoolName: 'library-recommendation-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    // Cognito User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'LibraryUserPoolClient', {
      userPool,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false, // For web apps, don't generate secret
    });

    // DynamoDB Tables
    const booksTable = new dynamodb.Table(this, 'BooksTable', {
      tableName: 'library-books',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
    });

    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'library-users',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
    });

    const readingListsTable = new dynamodb.Table(this, 'ReadingListsTable', {
      tableName: 'library-reading-lists',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'listId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
    });

    // IAM Role for Lambda functions
    const lambdaRole = new iam.Role(this, 'LibraryLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              resources: [
                booksTable.tableArn,
                usersTable.tableArn,
                readingListsTable.tableArn,
              ],
            }),
          ],
        }),
        BedrockAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',
              ],
              resources: ['*'], // Bedrock model ARNs
            }),
          ],
        }),
      },
    });

    // Lambda function for API
    const apiLambda = new lambda.Function(this, 'LibraryApiLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event, null, 2));
          
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type,Authorization',
              'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            },
            body: JSON.stringify({
              message: 'Library API is working!',
              path: event.path,
              method: event.httpMethod,
            }),
          };
        };
      `),
      role: lambdaRole,
      environment: {
        BOOKS_TABLE: booksTable.tableName,
        USERS_TABLE: usersTable.tableName,
        READING_LISTS_TABLE: readingListsTable.tableName,
        USER_POOL_ID: userPool.userPoolId,
        USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });

    // API Gateway
    const api = new apigateway.RestApi(this, 'LibraryApi', {
      restApiName: 'Library Recommendation API',
      description: 'API for the library recommendation system',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // API Gateway integration
    const lambdaIntegration = new apigateway.LambdaIntegration(apiLambda);

    // API routes
    const booksResource = api.root.addResource('books');
    booksResource.addMethod('GET', lambdaIntegration);
    booksResource.addMethod('POST', lambdaIntegration);

    const bookResource = booksResource.addResource('{id}');
    bookResource.addMethod('GET', lambdaIntegration);
    bookResource.addMethod('PUT', lambdaIntegration);
    bookResource.addMethod('DELETE', lambdaIntegration);

    const usersResource = api.root.addResource('users');
    usersResource.addMethod('GET', lambdaIntegration);
    usersResource.addMethod('POST', lambdaIntegration);

    const userResource = usersResource.addResource('{userId}');
    userResource.addMethod('GET', lambdaIntegration);
    userResource.addMethod('PUT', lambdaIntegration);

    const readingListsResource = userResource.addResource('reading-lists');
    readingListsResource.addMethod('GET', lambdaIntegration);
    readingListsResource.addMethod('POST', lambdaIntegration);

    const recommendationsResource = api.root.addResource('recommendations');
    recommendationsResource.addMethod('GET', lambdaIntegration);

    // Output important values - commented out to match teammate's output
    // new cdk.CfnOutput(this, 'UserPoolId', {
    //   value: userPool.userPoolId,
    //   description: 'Cognito User Pool ID',
    // });

    // new cdk.CfnOutput(this, 'UserPoolClientId', {
    //   value: userPoolClient.userPoolClientId,
    //   description: 'Cognito User Pool Client ID',
    // });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    // new cdk.CfnOutput(this, 'Region', {
    //   value: this.region,
    //   description: 'AWS Region',
    // });
  }
}
