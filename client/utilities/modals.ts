/**
 * Opens a modal with the given id
 * @param {string} modalId
 * @returns
 */
export const openModal = (modalId: string) => $(`#${modalId}`).modal('show');
/**
 * Closes a modal with the given id
 * @param {string} modalId
 * @returns
 */
export const closeModal = (modalId: string) => $(`#${modalId}`).modal('hide');
/**
 * Closes all modals accessible by the user
 * @date 10/12/2023 - 1:11:44 PM
 */
export const closeAllModals = () => $('.modal').modal('hide');
