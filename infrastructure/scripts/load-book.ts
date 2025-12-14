import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const books= [
    {
        id: '1',
        title: 'Atomic Habits',
        author: 'James Clear',
        genre: 'Non-fiction',
        description: 'Easy guide to building good habits and breaking bad ones',
        rating: 4.5,
        publishedYear: 2018,
        isbn: '978-0738784'
    },
    {
        id: '2',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        genre: 'Fiction',
        description: 'A classic American novel about the Jazz Age',
        rating: 4.2,
        publishedYear: 1925,
        isbn: '978-0743273565'
    },
    {
        id: '3',
        title: 'Sapiens',
        author: 'Yuval Noah Harari',
        genre: 'History',
        description: 'A brief history of humankind',
        rating: 4.4,
        publishedYear: 2014,
        isbn: '978-0062316097'
    },
    {
        id: '4',
        title: 'The Psychology of Money',
        author: 'Morgan Housel',
        genre: 'Finance',
        description: 'Timeless lessons on wealth, greed, and happiness',
        rating: 4.6,
        publishedYear: 2020,
        isbn: '978-0857197689'
    },
    {
        id: '5',
        title: '1984',
        author: 'George Orwell',
        genre: 'Dystopian Fiction',
        description: 'A dystopian social science fiction novel',
        rating: 4.3,
        publishedYear: 1949,
        isbn: '978-0451524935'
    },
    {
        id: '6',
        title: 'Educated',
        author: 'Tara Westover',
        genre: 'Memoir',
        description: 'A memoir about education and family',
        rating: 4.4,
        publishedYear: 2018,
        isbn: '978-0399590504'
    },
    {
        id: '7',
        title: 'The Lean Startup',
        author: 'Eric Ries',
        genre: 'Business',
        description: 'How constant innovation creates radically successful businesses',
        rating: 4.1,
        publishedYear: 2011,
        isbn: '978-0307887894'
    },
    {
        id: '8',
        title: 'Dune',
        author: 'Frank Herbert',
        genre: 'Science Fiction',
        description: 'Epic science fiction novel set on the desert planet Arrakis',
        rating: 4.5,
        publishedYear: 1965,
        isbn: '978-0441172719'
    },
    {
        id: '9',
        title: 'Becoming',
        author: 'Michelle Obama',
        genre: 'Biography',
        description: 'Memoir by former First Lady Michelle Obama',
        rating: 4.7,
        publishedYear: 2018,
        isbn: '978-1524763138'
    },
    {
        id: '10',
        title: 'The Alchemist',
        author: 'Paulo Coelho',
        genre: 'Fiction',
        description: 'A philosophical novel about following your dreams',
        rating: 4.0,
        publishedYear: 1988,
        isbn: '978-0062315007'
    },
    {
        id: '11',
        title: 'Clean Code',
        author: 'Robert C. Martin',
        genre: 'Programming',
        description: 'A handbook of agile software craftsmanship',
        rating: 4.3,
        publishedYear: 2008,
        isbn: '978-0132350884'
    }
];
async function loadBooks() {
  try {
    // Split books into batches of 25 (DynamoDB BatchWrite limit)
    const batchSize = 25;
    const batches = [];

    for (let i = 0; i < books.length; i += batchSize) {
      batches.push(books.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const putRequests = batch.map((book) => ({
        PutRequest: {
          Item: book,
        },
      }));

      const command = new BatchWriteCommand({
        RequestItems: {
          Books: putRequests,
        },
      });

      const result = await docClient.send(command);
      console.log(`Loaded batch of ${batch.length} books`);

      if (result.UnprocessedItems && Object.keys(result.UnprocessedItems).length > 0) {
        console.warn('Some items were not processed:', result.UnprocessedItems);
      }
    }

    console.log(`Successfully loaded ${books.length} books into DynamoDB`);
  } catch (error) {
    console.error('Error loading books:', error);
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  loadBooks();
}