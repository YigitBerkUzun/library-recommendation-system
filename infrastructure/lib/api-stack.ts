import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import * as path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface ApiStackProps extends cdk.StackProps {
  booksTable: dynamodb.ITable;
  readingListsTable: dynamodb.ITable;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly booksTable: dynamodb.ITable;
  public readonly readingListsTable: dynamodb.ITable;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Store table references
    this.booksTable = props.booksTable;
    this.readingListsTable = props.readingListsTable;
    this.api = new apigateway.RestApi(this, 'LibraryAPI', {
      restApiName: ' Library Recommendation System API',
      description: 'This is the API for the final project of the course',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });
    const getBooks = new NodejsFunction(this, 'GetBooksFuncition', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/get-books/index.ts'),
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64,
      environment: {
        BOOKS_TABLE_NAME: props.booksTable.tableName,
      },
    });

    const getBook = new NodejsFunction(this, 'GetBookFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/get-book/index.ts'),
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64,
      environment: {
        BOOKS_TABLE_NAME: props.booksTable.tableName,
      },
    });
    props.booksTable.grantReadData(getBooks);
    props.booksTable.grantReadData(getBook);

    const getBooksResource = this.api.root.addResource('getBooks');
    getBooksResource.addMethod('GET', new apigateway.LambdaIntegration(getBooks));

    const getBookByIdResource = getBooksResource.addResource('{id}');
    getBookByIdResource.addMethod('GET', new apigateway.LambdaIntegration(getBook));

    // Reading Lists Lambda Functions
    const getReadingLists = new NodejsFunction(this, 'GetReadingListsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/get-reading-lists/index.ts'),
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64,
      environment: {
        READING_LISTS_TABLE_NAME: props.readingListsTable.tableName,
      },
    });

    const createReadingList = new NodejsFunction(this, 'CreateReadingListFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/create-reading-lists/index.ts'),
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64,
      environment: {
        READING_LISTS_TABLE_NAME: props.readingListsTable.tableName,
      },
    });

    const updateReadingList = new NodejsFunction(this, 'UpdateReadingListFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/update-reading-lists/index.ts'),
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64,
      environment: {
        READING_LISTS_TABLE_NAME: props.readingListsTable.tableName,
      },
    });

    const deleteReadingList = new NodejsFunction(this, 'DeleteReadingListFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/delete-reading-lists/index.ts'),
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      architecture: lambda.Architecture.ARM_64,
      environment: {
        READING_LISTS_TABLE_NAME: props.readingListsTable.tableName,
      },
    });

    // Grant permissions
    props.readingListsTable.grantReadData(getReadingLists);
    props.readingListsTable.grantWriteData(createReadingList);
    props.readingListsTable.grantReadWriteData(updateReadingList);
    props.readingListsTable.grantReadWriteData(deleteReadingList);

    // API Resources for Reading Lists
    const readingListsResource = this.api.root.addResource('reading-lists');
    readingListsResource.addMethod('GET', new apigateway.LambdaIntegration(getReadingLists));
    readingListsResource.addMethod('POST', new apigateway.LambdaIntegration(createReadingList));

    const readingListByIdResource = readingListsResource.addResource('{id}');
    readingListByIdResource.addMethod('PUT', new apigateway.LambdaIntegration(updateReadingList));
    readingListByIdResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(deleteReadingList)
    );

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
    });
  }
}