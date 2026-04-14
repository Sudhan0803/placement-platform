const admin = require('firebase-admin');
const serviceAccount = require('./firebase-admin.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedData() {
  try {
    // Add companies
    const companies = [
      { name: 'Google India', description: 'Leading technology company specializing in AI and cloud', package: '24 LPA', location: 'Bangalore' },
      { name: 'Microsoft', description: 'Global software leader', package: '28 LPA', location: 'Hyderabad' },
      { name: 'Amazon', description: 'E-commerce and cloud computing giant', package: '30 LPA', location: 'Bangalore' },
      { name: 'Infosys', description: 'Leading IT consulting company', package: '12 LPA', location: 'Pune' },
      { name: 'TCS', description: 'Tata Consultancy Services', package: '10 LPA', location: 'Mumbai' }
    ];
    
    for (const company of companies) {
      await db.collection('companies').add(company);
      console.log(`Added: ${company.name}`);
    }
    
    // Add sample test
    const test = {
      title: 'Technical Aptitude Test 2024',
      questions: [
        {
          questionText: 'What is React?',
          options: ['JavaScript library', 'Programming language', 'Database', 'CSS framework'],
          correctOption: 0
        },
        {
          questionText: 'Which hook is used for state in React?',
          options: ['useEffect', 'useState', 'useContext', 'useReducer'],
          correctOption: 1
        },
        {
          questionText: 'What does Firebase provide?',
          options: ['Authentication', 'Database', 'Hosting', 'All of the above'],
          correctOption: 3
        },
        {
          questionText: 'What is the purpose of JWT?',
          options: ['Authentication', 'Database query', 'UI rendering', 'File upload'],
          correctOption: 0
        },
        {
          questionText: 'Which method is used to make API calls in React?',
          options: ['fetch()', 'axios()', 'Both', 'None'],
          correctOption: 2
        }
      ],
      passingScore: 60
    };
    
    await db.collection('tests').add(test);
    console.log('✅ Sample test added');
    
    console.log('\n🎉 Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedData();