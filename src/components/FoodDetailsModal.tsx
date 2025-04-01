'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaUtensils, FaClock, FaUsers, FaTimes } from 'react-icons/fa';

interface FoodDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  food: {
    name: string;
    meal_type: string;
    ingredients: string[];
    instructions: string[];
    prep_time?: string;
    servings?: number;
  };
}

export default function FoodDetailsModal({ isOpen, onClose, food }: FoodDetailsModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-xl font-semibold text-[#0F1E0F]">
                    {food.name}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaUtensils className="w-4 h-4" />
                    <span>{food.meal_type}</span>
                  </div>
                  {food.prep_time && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaClock className="w-4 h-4" />
                      <span>{food.prep_time}</span>
                    </div>
                  )}
                  {food.servings && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FaUsers className="w-4 h-4" />
                      <span>{food.servings} servings</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-[#0F1E0F] mb-2">Ingredients</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {food.ingredients.map((ingredient, index) => (
                        <li key={index} className="text-gray-600">{ingredient}</li>
                      ))}
                    </ul>
                  </div>

                  {food.instructions && food.instructions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-[#0F1E0F] mb-2">Instructions</h4>
                      <ol className="list-decimal list-inside space-y-2">
                        {food.instructions.map((instruction, index) => (
                          <li key={index} className="text-gray-600">{instruction}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 