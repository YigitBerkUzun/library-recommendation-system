import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DatabaseStack extends cdk.Stack {
    public readonly booksTable: dynamodb.Table;
    public readonly readingListsTable: dynamodb.Table;

    constructor (scope: Construct, id: string ,props:cdk.StackProps){
        super(scope,id,props);
        this.booksTable=new dynamodb.Table(this,'BooksTable',{
            tableName:'Books',
            partitionKey:{
                name:'id',
                type: dynamodb.AttributeType.STRING,

            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy:cdk.RemovalPolicy.DESTROY,

        })
        this.readingListsTable= new dynamodb.Table(this,'ReadingListsTable',{
            tableName:'ReadingLists',
            partitionKey:{
                name:'id',
                type: dynamodb.AttributeType.STRING,

            },
            sortKey: {
                name: 'userId',
                type: dynamodb.AttributeType.STRING,
            },


            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy:cdk.RemovalPolicy.DESTROY,

        });

        this.readingListsTable.addGlobalSecondaryIndex({
            indexName: 'id-index',
            partitionKey: {
                name: 'id',
                type: dynamodb.AttributeType.STRING,
            },
        });
         new cdk.CfnOutput(this, 'BooksTableName' , {
            value: this.booksTable.tableName,
         });
         
          new cdk.CfnOutput(this, 'ReadingListTableName' , {
            value: this.readingListsTable.tableName,
         });
    }

}