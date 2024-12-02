import useUploadModal from "@/hooks/useUploadModal";
import Modal from "./Modal";
import FilesInfo from "./FilesInfo";

const UploadModal = () => {
  const uploadModal = useUploadModal();

  const onChange = (open: boolean) => {
    if (!open) {
      uploadModal.onClose();
    }
  };

  return (
    <Modal
      title="Adicionar uma música"
      description="Podem fazer upload de um ou mais ficheiros de uma só vez, mas por favor tentem sempre fornecer as informções corretas sobre a música :)"
      isOpen={uploadModal.isOpen}
      onChange={onChange}
    >
      <div>
        {/* FilesInfo component handles uploads and displays uploaded files */}
        <FilesInfo />
      </div>
    </Modal>
  );
};

export default UploadModal;
