"use client";

import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Trash from '../public/red_trash.png'

type User = {
  id: number;
  name: string;
  age: string;
  email: string;
};

type Tema = "light" | "dark";

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");

  const [tema, setTema] = useState<Tema>("light");

  useEffect(() => {
    document.body.className = tema;
  }, [tema]);

  function cadastroUsuario() {
    if (!name.trim() || !age || !email.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    const novoUsuario: User = {
      id: Date.now(),
      name: name.trim(),
      age,
      email: email.trim(),
    };<h1>Cadastro de usuário</h1>

    setUsers((usersAtuais) => [...usersAtuais, novoUsuario]);

    setName("");
    setAge("");
    setEmail("");

    toast.success("Usuário cadastrado com sucesso");
  }

  function removerUsuario(id: number) {
    setUsers((usersAtuais) =>
      usersAtuais.filter((user) => user.id !== id)
    );

    toast.success("Usuário removido");
  }

  function alterarTema() {
    setTema((temaAtual) =>
      temaAtual === "light" ? "dark" : "light"
    );
  }

  return (
    <>
      <ToastContainer />

      <button className='theme-button' type="button" onClick={alterarTema}>
        {tema === "light" ? "Tema Escuro" : "Tema Claro"}
      </button>

      <div className={`container ${tema}`}>
        

        <form>
          <h1>Cadastro de usuário</h1>

          <input
            placeholder="Nome"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <input
            placeholder="Idade"
            type="number"
            value={age}
            onChange={(event) => setAge(event.target.value)}
          />

          <input
            placeholder="E-mail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <button type="button" onClick={cadastroUsuario}>
            Cadastrar
          </button>
        </form>

        {users.map((user) => (
          <div key={user.id} className="card">
            <div>
              <p>
                Nome: <span>{user.name}</span>
              </p>

              <p>
                Idade: <span>{user.age}</span>
              </p>

              <p>
                E-mail: <span>{user.email}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => removerUsuario(user.id)}
            >
              <img src={Trash.src} alt="lixeira" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}