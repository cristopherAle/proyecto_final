import { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import 'animate.css';


export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Lógica de autenticación
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validación de campos
        if (!email.trim() || !password.trim()) {
            setError('Los datos ingresados no son válidos.');
            return;
        }

        setTimeout(() => {
            setIsLoggedIn(true);
            setError('');
            setEmail('');
            setPassword('');
        }, 1000);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
    };


    if (isLoggedIn) {
        return (
            <div className='col-md-3 mx-auto animate__animated animate__fadeIn'>
                <h1 className='mt-3'>Bienvenido!</h1>

                {/* Insertar componente Perfil */}

                <Button variant='primary btn-dark mb-3' onClick={handleLogout}>
                    Cerrar sesión
                </Button>
            </div>
        );
    }

    return (


        <div className='d-flex justify-content-center align-items-center vh-100' >
            <div className='col-md-3 mx-auto border border-dark rounded p-5 animate__animated animate__fadeIn'>
                <h1 className='mt-3'>Login</h1>

                <Form onSubmit={handleSubmit}>
                    <Form.Group className='mb-3' controlId='formBasicEmail'>
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type='email'
                            placeholder='Ingresa tu email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </Form.Group>

                    <Form.Group className='mb-3' controlId='formBasicPassword'>
                        <Form.Label>Contraseña</Form.Label>
                        <Form.Control
                            type='password'
                            placeholder='Ingresa tu contraseña'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </Form.Group>

                    <div className="d-flex justify-content-center">
                        <Button variant='primary btn-dark mb-3' type='submit'>
                            Enviar
                        </Button>

                    </div>
                </Form>

                {error ? <p className='error'>{error}</p> : null}
            </div>


        </div>


    );
};
