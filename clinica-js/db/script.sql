CREATE DATABASE dbClinica;
GO
USE dbClinica;
GO

-- Tabela Paciente
CREATE TABLE Paciente (
    Codigo INT IDENTITY(1,1) PRIMARY KEY,
    Nome VARCHAR(100) NOT NULL,
    Cpf VARCHAR(14) NOT NULL UNIQUE,
    Telefone VARCHAR(20) NOT NULL,
    DataNascimento DATE NOT NULL
);
GO

-- Tabela Medico
CREATE TABLE Medico (
    Codigo INT IDENTITY(1,1) PRIMARY KEY,
    Nome VARCHAR(100) NOT NULL,
    Crm VARCHAR(20) NOT NULL UNIQUE,
    Especialidade VARCHAR(50) NOT NULL
);
GO

-- Tabela Consulta
CREATE TABLE Consulta (
    Codigo INT IDENTITY(1,1) PRIMARY KEY,
    DataHora DATETIME NOT NULL,
    StatusConsulta VARCHAR(30) NOT NULL,
    PacienteId INT NOT NULL,
    MedicoId INT NOT NULL,
    CONSTRAINT FK_Consulta_Paciente FOREIGN KEY (PacienteId)
        REFERENCES Paciente(Codigo),
    CONSTRAINT FK_Consulta_Medico FOREIGN KEY (MedicoId)
        REFERENCES Medico(Codigo)
);
GO

-- Dados iniciais para teste
INSERT INTO Paciente (Nome, Cpf, Telefone, DataNascimento) VALUES
('Maria Oliveira', '111.222.333-44', '(11) 98888-7777', '1990-05-15'),
('João Souza', '555.666.777-88', '(11) 97777-6666', '1985-10-20');

INSERT INTO Medico (Nome, Crm, Especialidade) VALUES
('Dra. Helena Rios', 'CRM/SP 123456', 'Cardiologia'),
('Dr. Roberto Alves', 'CRM/SP 654321', 'Ortopedia');

INSERT INTO Consulta (DataHora, StatusConsulta, PacienteId, MedicoId) VALUES
('2026-10-15T14:00:00', 'Agendada', 1, 1),
('2026-10-16T09:30:00', 'Agendada', 2, 2);
GO
