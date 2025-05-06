import useUploadModal from "@/hooks/useUploadModal";
import Modal from "./Modal";
import FilesInfo from "./FilesInfo";
import { useRouter } from "next/navigation";

const UploadModal = () => {
  const uploadModal = useUploadModal();
  const router = useRouter();  // initialize the router

  const onChange = (open: boolean) => {
    if (!open) {
      uploadModal.onClose();
      // Refresh the page after modal closes
      router.refresh();  // This will refresh the current page
      // Alternatively, you can use window.location.reload() if needed
      // window.location.reload();
    }
  };

  return (
    <Modal
      title="Adicionar uma música"
      description="Faça upload de um ou mais ficheiros de uma só vez, mas forneça sempre as informções corretas sobre a música"
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
