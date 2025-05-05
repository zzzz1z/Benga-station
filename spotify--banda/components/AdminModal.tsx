import useAdminModal from "@/hooks/useAdminModal";
import Modal from "./Modal";

const AdminModal = () => {
  const adminModal = useAdminModal();

  const onChange = (open: boolean) => {
    if (!open) {
      adminModal.onClose();
    }
  };

  return (
    <Modal
      title="Inscrição"
      description="Preencha as suas informações e o porquê que gostaria de se juntar  nós"
      isOpen={adminModal.isOpen}
      onChange={onChange}
    >
      <div>
        {/* Form or content for the admin application goes here */}
        <p>Form content goes here!</p>
      </div>
    </Modal>
  );
};

export default AdminModal;
