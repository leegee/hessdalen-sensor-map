import React, { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './Modal.css';

interface ModalProps {
    children?: ReactNode;
    title?: string;
}

const Modal: React.FC<ModalProps> = ({ children, title }) => {
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const navigate = useNavigate();

    function closeModal() {
        setIsOpen(false);
        navigate('/');
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            closeModal();
        }
    }

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    });

    return isOpen ? (
        <section id="modal">
            <div id='modal-content'>
                <h2>{title}
                    <nav id='modal-close' onClick={closeModal}></nav>
                </h2>
                <div id='modal-inner'>
                    {children}
                </div>
            </div>
        </section>
    ) : null;
};

export default Modal;
