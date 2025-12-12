import * as cdk from 'aws-cdk-lib';
import*as lambda from 'aws-cdk-lib/aws-lambda';
import*as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs'; 
import*as path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
export class ApiStack extends cdk.Stack{

    public readonly api:apigateway.RestApi;
    constructor (scope: Construct,id: string, props?:cdk.StackProps){
        super(scope,id,props);
        this.api=new apigateway.RestApi(this,'LibraryAPI',{
            restApiName:' Library Recommendation System API',
            description:'This is the API for the final project of the course',
            defaultCorsPreflightOptions:{
            allowOrigins:apigateway.Cors.ALL_ORIGINS,
            allowMethods: apigateway.Cors.ALL_METHODS,
            allowHeaders:['Content-Type','Authorization'],
            },

        });
        const helloLambda=new NodejsFunction(this,'HelloWorldFunction' , {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler:'handler',
        });

    }
}
