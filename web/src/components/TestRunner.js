import React from 'react';
import testAuth from '../test/testAuth';

const TestRunner = () => {
  const runTests = async () => {
    try {
      await testAuth();
      console.log('Tests completed');
    } catch (error) {
      console.error('Test runner error:', error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Test Runner</h1>
      <button
        onClick={runTests}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Run Auth Tests
      </button>
    </div>
  );
};

export default TestRunner;
