import { useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { useAuth } from "../context/AuthProvider";
import { useNavigate } from "react-router-dom";
import 'animate.css';

export const SignupPage = () => {
    const { error, email, setEmail, password, setPassword, handleSubmit, isRegistered, name, setName } = useAuth();

    const navigate = useNavigate(); 
    
    // Agregar un efecto para redirigir después de que se registre
    useEffect(() => {
        if (isRegistered) {
            setTimeout(() => {
                navigate('/'); // Redirigir a la página principal
            }, 1500);
        }
    }, [isRegistered, navigate]);

    return (
        <div className='d-flex justify-content-center align-items-center vh-100' >
            <div className='col-md-3 mx-auto border border-dark rounded p-5 animate__animated animate__fadeIn'>
                <h1 className='mt-3'>Regístrate</h1>
                <Form onSubmit={(e) => handleSubmit(e, 'register')}>
                    <Form.Group className="mb-3" controlId="formBasicName">
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            type="text"
                            placeholder="Ingresa tu nombre" />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formBasicEmail">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            type="email"
                            placeholder="Ingresa tu email" />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formBasicPassword">
                        <Form.Label>Contraseña</Form.Label>
                        <Form.Control
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            type="password"
                            placeholder="Ingresa tu contraseña" />
                    </Form.Group>
                    <div className="d-flex justify-content-center">
                        <Button variant="primary btn-dark mb-3" type="submit">
                            Registrarse
                        </Button>
                    </div>
                </Form>
                {error && <p className="error">Los datos ingresados no son válidos.</p>}
                {isRegistered && <p className="success">¡Registro exitoso! Redirigiendo...</p>}
            </div>
        </div>
    );
};
