'use client';

import { Fragment, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FaTimes } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface MealPlansSlideover {
  isOpen: boolean;
  onClose: () => void;
  onMealPlanAdded?: () => void;
  children: React.ReactNode;
  mode?: 'create' | 'edit';
  mealPlan?: any;  // Add proper type later
}

export default function MealPlansSlideover({ 
  isOpen, 
  onClose, 
  onMealPlanAdded, 
  children,
  mode = 'create',
  mealPlan
}: MealPlansSlideover) {
  const router = useRouter();

  const handleClose = useCallback(async () => {
    try {
      // First trigger any data updates and wait for them to complete
      if (onMealPlanAdded) {
        await onMealPlanAdded();
      }
      
      // Close the panel
      onClose();

      // Wait a brief moment for state updates to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Force a browser refresh
      window.location.reload();
    } catch (error) {
      console.error('Error during close:', error);
      // Still do the refresh even if there's an error
      window.location.reload();
    }
  }, [onClose, onMealPlanAdded]);

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div 
            className="fixed inset-0 bg-black/30" 
            aria-hidden="true"
            onClick={handleClose}
          />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-4xl">
                  <div className="flex h-full flex-col overflow-y-auto bg-white">
                    <div className="px-6 pt-6 pb-4 border-b border-gray-200">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-xl font-medium text-gray-900">
                          {mode === 'create' ? 'Create Meal Plan' : 'Edit Meal Plan'}
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-500"
                            onClick={handleClose}
                          >
                            <span className="sr-only">Close panel</span>
                            <FaTimes className="h-5 w-5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative flex-1 px-6 py-6">
                      {children}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 