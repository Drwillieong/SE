import React from 'react';
import Modal from 'react-modal';

const CheckOrderModal = ({
  checkOrderModalIsOpen,
  setCheckOrderModalIsOpen,
  selectedBookingForOrder,
  orderFormData,
  setOrderFormData,
  laundryPhotoPreview,
  handleOrderFormChange,
  handleLaundryPhotoChange,
  createTestOrder,
  handleOrderFormSubmit,
  creatingOrder,
  setSelectedBookingForOrder,
  setLaundryPhotoFile,
  setLaundryPhotoPreview,
  fetchBookings,
  navigate
}) => {
  return (
    <Modal
      isOpen={checkOrderModalIsOpen}
      onRequestClose={() => setCheckOrderModalIsOpen(false)}
      contentLabel="Check Order Modal"
      className="modal-content"
      overlayClassName="modal-overlay"
    >
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Order Details</h2>
        <form onSubmit={handleOrderFormSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Total Clothes
              </label>
              <input
                type="number"
                name="estimatedClothes"
                value={orderFormData.estimatedClothes}
                onChange={handleOrderFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kilos of Laundry
              </label>
              <input
                type="number"
                step="0.1"
                name="kilos"
                value={orderFormData.kilos}
                onChange={handleOrderFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Pants
              </label>
              <input
                type="number"
                name="pants"
                value={orderFormData.pants}
                onChange={handleOrderFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Shorts
              </label>
              <input
                type="number"
                name="shorts"
                value={orderFormData.shorts}
                onChange={handleOrderFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of T-Shirts
              </label>
              <input
                type="number"
                name="tshirts"
                value={orderFormData.tshirts}
                onChange={handleOrderFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Bedsheets
              </label>
              <input
                type="number"
                name="bedsheets"
                value={orderFormData.bedsheets}
                onChange={handleOrderFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo of Laundry
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLaundryPhotoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {laundryPhotoPreview && (
              <img
                src={laundryPhotoPreview}
                alt="Laundry Preview"
                className="mt-2 max-w-full h-32 object-cover rounded-md"
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCheckOrderModalIsOpen(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={createTestOrder}
              disabled={creatingOrder}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {creatingOrder ? 'Creating...' : 'Test Order'}
            </button>
            <button
              type="submit"
              disabled={creatingOrder}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {creatingOrder ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CheckOrderModal;
