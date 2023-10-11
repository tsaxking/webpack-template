export const openModal = (modalId: string) => $(`#${modalId}`).modal('show');
export const closeModal = (modalId: string) => $(`#${modalId}`).modal('hide');
export const closeAllModals = () => $('.modal').modal('hide');