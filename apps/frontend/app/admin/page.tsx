"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BACKEND_URL } from '@/config';
import { useAuth } from '@clerk/nextjs';

interface Validator {
  id: string;
  publicKey: string;
  pendingPayouts: number;
  isOnline: boolean;
}

function AdminDashboard() {
  const [validators, setValidators] = useState<Validator[]>([]);
  const [selectedValidator, setSelectedValidator] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const { getToken } = useAuth();

  // Fetch validators
  const fetchValidators = async () => {
    try {
      const response = await axios.get(`${API_BACKEND_URL}/api/v1/validators`);
      setValidators(response.data.validators);
    } catch (error) {
      console.error('Error fetching validators:', error);
    }
  };

  // Process payout
  const handlePayout = async (validatorId: string) => {
    try {
      const token = await getToken();
      const response = await axios.post(
        `${API_BACKEND_URL}/api/v1/payout/${validatorId}`,
        { amount: payoutAmount },
        {
          headers: { Authorization: token },
        }
      );
      
      // Refresh validators after successful payout
      fetchValidators();
      
      // Reset form
      setPayoutAmount(0);
      setSelectedValidator(null);
      
      // You might want to handle the transaction signature here
      console.log('Payout successful:', response.data);
    } catch (error) {
      console.error('Error processing payout:', error);
    }
  };

  useEffect(() => {
    fetchValidators();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          Validator Management
        </h1>

        {/* Validators Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Validator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Pending Payouts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {validators.map((validator) => (
                <tr key={validator.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {validator.publicKey.slice(0, 8)}...{validator.publicKey.slice(-8)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      validator.isOnline
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {validator.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {validator.pendingPayouts} SOL
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {selectedValidator === validator.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(Number(e.target.value))}
                          className="w-24 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          min="0"
                          step="0.1"
                        />
                        <button
                          onClick={() => handlePayout(validator.id)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setSelectedValidator(null)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedValidator(validator.id)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Process Payout
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Total Validators
            </h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {validators.length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Active Validators
            </h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {validators.filter(v => v.isOnline).length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Total Pending Payouts
            </h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {validators.reduce((sum, v) => sum + v.pendingPayouts, 0)} SOL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard; 