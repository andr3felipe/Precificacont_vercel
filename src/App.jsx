import { lazy, Suspense, useEffect, useState } from "react";







import {



  Eye,



  EyeOff,



  Loader2,



  LockKeyhole,



  LogOut,



  Mail,



  ShieldCheck,



  Moon,



  Sun,



  Building2,



  ChevronDown,



  BarChart3,



  TrendingUp,



  ArrowRight,



  Users,



} from "lucide-react";







import Sidebar from "./components/Sidebar";



import { supabase } from "./supabase";







// PERFORMANCE:



// Cada módulo pesado do sistema passa a ser carregado em um chunk separado.



// Assim, abrir o PrecificaCont não obriga o navegador a baixar, interpretar e



// executar CRM, Propostas, Relatórios, Simulações etc. todos ao mesmo tempo.



const Dashboard = lazy(() => import("./pages/Dashboard"));



const NovaSimulacao = lazy(() => import("./pages/NovaSimulacao"));



const Clientes = lazy(() => import("./pages/Clientes"));



const Simulacoes = lazy(() => import("./pages/Simulacoes"));



const Reprecificacao = lazy(() => import("./pages/Reprecificacao"));



const Relatorios = lazy(() => import("./pages/Relatorios"));



const Configuracoes = lazy(() => import("./pages/Configuracoes"));



const ServicosAdicionais = lazy(() => import("./pages/ServicosAdicionais"));



const Propostas = lazy(() => import("./pages/Propostas.jsx"));



const PropostaPublica = lazy(() => import("./pages/PropostaPublica.jsx"));



const CRMComercial = lazy(() => import("./pages/CRMComercial.jsx"));



const MinhaConta = lazy(() => import("./pages/MinhaConta.jsx"));



const PrecificaContControl = lazy(() => import("./pages/PrecificaContControl.jsx"));



const ReformaTributaria = lazy(() => import("./pages/ReformaTributaria.jsx"));







function CarregandoModulo() {



  return (



    <div className="min-h-[50vh] flex items-center justify-center">



      <div className="text-center">



        <Loader2 className="mx-auto animate-spin text-blue-600" size={30} />



        <p className="mt-3 text-sm font-medium text-slate-500">



          Carregando módulo...



        </p>



      </div>



    </div>



  );



}







function TelaLogin({ onLogin }) {



  const [email, setEmail] = useState("");



  const [senha, setSenha] = useState("");



  const [mostrarSenha, setMostrarSenha] = useState(false);



  const [carregando, setCarregando] = useState(false);



  const [erro, setErro] = useState("");







  const entrar = async (event) => {



    event.preventDefault();



    const emailLimpo = email.trim();







    if (!emailLimpo || !senha) {



      setErro("Informe seu e-mail e sua senha.");



      return;



    }







    setCarregando(true);



    setErro("");







    try {



      const { data, error } = await supabase.auth.signInWithPassword({



        email: emailLimpo,



        password: senha,



      });







      if (error) throw error;



      if (!data?.session)



        throw new Error("O login foi aceito, mas a sessão não foi criada.");







      onLogin(data.session);



    } catch (error) {



      console.error("Erro ao entrar:", error);



      const mensagem = String(error?.message || "").toLowerCase();







      if (



        mensagem.includes("invalid login credentials") ||



        mensagem.includes("invalid credentials")



      ) {



        setErro("E-mail ou senha inválidos.");



      } else if (mensagem.includes("email not confirmed")) {



        setErro("Seu e-mail ainda não foi confirmado.");



      } else {



        setErro(



          error?.message ||



            "Não foi possível entrar. Verifique seus dados e tente novamente."



        );



      }



    } finally {



      setCarregando(false);



    }



  };







  return (



    <div className="relative min-h-screen overflow-hidden bg-[#061d48] text-white">



      <div className="pointer-events-none absolute inset-0 overflow-hidden">



        {/* Fundo premium em azul-marinho, com profundidade sutil de escritório.



            Mantém todo o conteúdo/login existente intacto. */}



        <div className="absolute inset-0 bg-[#03142f]" />



        <div className="absolute inset-0 bg-[linear-gradient(112deg,rgba(8,48,100,.96)_0%,rgba(3,24,57,.94)_42%,rgba(2,17,42,.98)_100%)]" />







        {/* Formas abstratas simulam vidro, divisórias e luzes de um escritório ao fundo,



            sempre bem discretas para não competir com o conteúdo principal. */}



        <div className="absolute -left-[5%] top-[-12%] h-[72%] w-[38%] -skew-x-[13deg] rounded-[70px] border border-white/[0.035] bg-gradient-to-br from-blue-400/[0.08] via-blue-300/[0.025] to-transparent blur-[1px]" />



        <div className="absolute left-[31%] top-[-18%] h-[72%] w-[18%] -skew-x-[13deg] border-x border-white/[0.035] bg-white/[0.018]" />



        <div className="absolute left-[53%] top-[-12%] h-[65%] w-[13%] -skew-x-[13deg] border-x border-white/[0.025] bg-blue-300/[0.015]" />



        <div className="absolute right-[7%] top-[4%] h-[38%] w-[20%] rounded-[28px] border border-white/[0.025] bg-blue-300/[0.018] shadow-[0_0_100px_rgba(20,115,255,.04)]" />







        {/* Mesa/ambiente apenas de relance na base. */}



        <div className="absolute bottom-[-13%] left-[-6%] h-[29%] w-[112%] -rotate-[1.5deg] bg-gradient-to-b from-white/[0.018] to-black/20 blur-[2px]" />



        <div className="absolute bottom-[8%] left-[8%] h-px w-[84%] bg-gradient-to-r from-transparent via-sky-300/[0.12] to-transparent" />







        {/* Iluminação azul controlada. */}



        <div className="absolute -left-[18%] -top-[30%] h-[780px] w-[780px] rounded-full bg-blue-500/[0.15] blur-[145px]" />



        <div className="absolute right-[-18%] top-[18%] h-[700px] w-[700px] rounded-full bg-[#006cff]/[0.10] blur-[155px]" />



        <div className="absolute bottom-[-34%] left-[34%] h-[620px] w-[620px] rounded-full bg-sky-400/[0.055] blur-[150px]" />







        {/* Vinheta garante leitura e mantém o fundo realmente secundário. */}



        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_18%,rgba(1,12,31,.10)_58%,rgba(1,10,27,.38)_100%)]" />



      </div>







      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1680px] items-center px-6 py-8 sm:px-8 lg:px-12 xl:px-16">



        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.08fr_.92fr] xl:gap-16">



          <section className="min-w-0">



            <img



              src="/precificacont-logo-dark-cortado.png"



              alt="PrecificaCont"



              className="h-auto w-[285px] object-contain object-left sm:w-[315px]"



            />







            <div className="mt-8 max-w-[760px]">



              <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/25 bg-white/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-sky-300 backdrop-blur">



                <TrendingUp size={15} />



                Precificação estratégica



              </div>







              <h1 className="mt-5 text-[43px] font-black leading-[1.02] tracking-[-0.05em] text-white sm:text-[55px] xl:text-[64px]">



                Transforme dados em



                <br />



                honorários{" "}



                <span className="text-[#1787ff]">mais inteligentes.</span>



              </h1>







              <p className="mt-5 max-w-[650px] text-base leading-7 text-blue-50/90 sm:text-lg">



                Precifique com estratégia, compare cenários e conduza negociações



                com muito mais segurança.



              </p>



            </div>







            <div className="mt-7 hidden lg:block">



              <div className="w-[96%] overflow-hidden rounded-[22px] border border-white/30 bg-[#07162d] p-[7px] shadow-[0_30px_80px_rgba(0,0,0,.32)]">



                <div className="overflow-hidden rounded-[15px] bg-white">



                  <img



                    src="/precificacont-dashboard.png"



                    alt="Dashboard do PrecificaCont"



                    className="block h-auto w-full"



                  />



                </div>



              </div>



            </div>



          </section>







          <section className="flex flex-col items-center lg:items-end">



            <div className="w-full max-w-[525px] rounded-[30px] border border-white/90 bg-white px-7 py-8 text-[#071a3b] shadow-[0_40px_100px_rgba(0,0,0,.28)] sm:px-10 sm:py-10">



              <div className="flex justify-center">



                <img



                  src="/precificacont-logo-premium.png"



                  alt="PrecificaCont"



                  className="h-auto w-[245px] object-contain"



                />



              </div>







              <form onSubmit={entrar} className="mt-8">



                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-600">



                  Área administrativa



                </p>



                <h2 className="mt-2 text-[31px] font-black tracking-[-0.04em] text-[#071a3b]">



                  Acesse sua conta



                </h2>



                <p className="mt-2 text-sm leading-6 text-slate-500">



                  Continue sua gestão no PrecificaCont.



                </p>







                <div className="mt-7">



                  <label className="mb-2 block text-sm font-bold text-[#10284d]">



                    E-mail



                  </label>



                  <div className="relative">



                    <Mail



                      size={18}



                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7390b5]"



                    />



                    <input



                      type="email"



                      autoComplete="email"



                      value={email}



                      onChange={(event) => {



                        setEmail(event.target.value);



                        if (erro) setErro("");



                      }}



                      placeholder="seu@email.com"



                      className="h-14 w-full rounded-xl border border-[#d8e2ef] bg-white pl-12 pr-4 text-[15px] text-[#10284d] outline-none transition placeholder:text-[#8299b6] focus:border-blue-500 focus:ring-4 focus:ring-blue-50"



                    />



                  </div>



                </div>







                <div className="mt-5">



                  <label className="mb-2 block text-sm font-bold text-[#10284d]">



                    Senha



                  </label>



                  <div className="relative">



                    <LockKeyhole



                      size={18}



                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7390b5]"



                    />



                    <input



                      type={mostrarSenha ? "text" : "password"}



                      autoComplete="current-password"



                      value={senha}



                      onChange={(event) => {



                        setSenha(event.target.value);



                        if (erro) setErro("");



                      }}



                      placeholder="Digite sua senha"



                      className="h-14 w-full rounded-xl border border-[#d8e2ef] bg-white pl-12 pr-12 text-[15px] text-[#10284d] outline-none transition placeholder:text-[#8299b6] focus:border-blue-500 focus:ring-4 focus:ring-blue-50"



                    />



                    <button



                      type="button"



                      onClick={() => setMostrarSenha((valor) => !valor)}



                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#7390b5] transition hover:bg-blue-50 hover:text-blue-600"



                      aria-label={



                        mostrarSenha ? "Ocultar senha" : "Mostrar senha"



                      }



                    >



                      {mostrarSenha ? (



                        <EyeOff size={18} />



                      ) : (



                        <Eye size={18} />



                      )}



                    </button>



                  </div>



                </div>







                <div className="mt-4 flex items-center justify-between gap-4 text-sm">



                  <label className="flex items-center gap-2 text-[#28466e]">



                    <input



                      type="checkbox"



                      className="h-4 w-4 rounded border-[#91a8c5] accent-blue-600"



                    />



                    Lembrar de mim



                  </label>



                  <span className="font-semibold text-blue-600">



                    Esqueceu sua senha?



                  </span>



                </div>







                {erro ? (



                  <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">



                    {erro}



                  </div>



                ) : null}







                <button



                  type="submit"



                  disabled={carregando}



                  className="mt-7 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2386ff] to-[#0874f9] px-4 text-base font-black text-white shadow-[0_15px_32px_rgba(0,117,255,.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"



                >



                  {carregando ? (



                    <>



                      <Loader2 size={19} className="animate-spin" />



                      Entrando...



                    </>



                  ) : (



                    <>



                      Entrar <ArrowRight size={19} />



                    </>



                  )}



                </button>







                <div className="mt-7 flex items-center justify-center gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500">



                  <ShieldCheck size={16} className="text-blue-500" />



                  Ambiente seguro e acesso restrito.



                </div>



              </form>



            </div>







            <div className="mt-8 hidden w-full max-w-[525px] grid-cols-3 divide-x divide-white/10 text-center lg:grid">



              <div className="px-4">



                <BarChart3 className="mx-auto text-sky-300" size={23} />



                <p className="mt-2 text-sm leading-5 text-blue-50">



                  Mais controle



                  <br />



                  na precificação



                </p>



              </div>



              <div className="px-4">



                <ShieldCheck className="mx-auto text-sky-300" size={23} />



                <p className="mt-2 text-sm leading-5 text-blue-50">



                  Decisões com



                  <br />



                  dados reais



                </p>



              </div>



              <div className="px-4">



                <Users className="mx-auto text-sky-300" size={23} />



                <p className="mt-2 text-sm leading-5 text-blue-50">



                  Crescimento



                  <br />



                  sustentável



                </p>



              </div>



            </div>



          </section>



        </div>



      </main>



    </div>



  );



}







function CarregandoSessao() {



  return (



    <div className="min-h-screen bg-slate-50 flex items-center justify-center">



      <div className="text-center">



        <Loader2 className="mx-auto animate-spin text-blue-600" size={34} />



        <p className="mt-3 text-sm font-medium text-slate-500">



          Carregando PrecificaCont...



        </p>



      </div>



    </div>



  );



}







function App() {



  const rotaPublicaProposta =



    window.location.pathname.startsWith("/proposta/");







  if (rotaPublicaProposta) {



    return (



      <Suspense fallback={<CarregandoModulo />}>



        <PropostaPublica />



      </Suspense>



    );



  }







  // Login único: depois da autenticação o sistema identifica automaticamente



  // se o usuário pertence ao Control ou a um escritório cliente.



  return <AppProtegido />;



}







function AppProtegido() {



  const [tipoAcesso, setTipoAcesso] = useState(undefined);



  const [sessao, setSessao] = useState(undefined);



  const [processandoConvite, setProcessandoConvite] = useState(false);



  const [erroConvite, setErroConvite] = useState("");



  const [acessoAdministrativo, setAcessoAdministrativo] = useState(null);



  const [vinculosIniciais, setVinculosIniciais] = useState(null);







  useEffect(() => {



    let montado = true;







    const iniciarSessao = async () => {



      try {



        const { data, error } = await supabase.auth.getSession();







        if (error) throw error;







        if (montado) {



          setSessao(data?.session ?? null);



        }



      } catch (error) {



        console.error("Erro ao recuperar sessão:", error);







        if (montado) {



          setSessao(null);



        }



      }



    };







    iniciarSessao();







    const {



      data: { subscription },



    } = supabase.auth.onAuthStateChange((_event, novaSessao) => {



      if (!montado) return;



      setSessao(novaSessao ?? null);



    });







    return () => {



      montado = false;



      subscription?.unsubscribe();



    };



  }, []);







  useEffect(() => {



    if (!sessao?.user?.id) return;







    const parametros = new URLSearchParams(window.location.search);



    const tokenConvite = parametros.get("convite");







    if (!tokenConvite) return;







    let ativo = true;







    const aceitarConvite = async () => {



      setProcessandoConvite(true);



      setErroConvite("");







      try {



        const { data, error } = await supabase.rpc(



          "aceitar_convite_escritorio",



          {



            p_token: tokenConvite,



          }



        );







        if (error) throw error;







        if (!data?.sucesso) {



          throw new Error("Não foi possível concluir o convite.");



        }







        if (!ativo) return;







        // Remove apenas o parâmetro do convite da URL depois da confirmação.



        // Mantém a sessão autenticada e evita tentar aceitar o mesmo convite



        // novamente ao atualizar a página.



        const url = new URL(window.location.href);



        url.searchParams.delete("convite");



        window.history.replaceState(



          {},



          document.title,



          `${url.pathname}${url.search}${url.hash}`



        );







        // Recarrega uma única vez para que Sidebar, permissões e dados



        // sejam lidos já com o vínculo usuário ↔ escritório criado.



        window.location.reload();



      } catch (error) {



        console.error("Erro ao aceitar convite:", error);







        if (ativo) {



          setErroConvite(



            error?.message ||



              "Não foi possível concluir o convite para este escritório."



          );



          setProcessandoConvite(false);



        }



      }



    };







    aceitarConvite();







    return () => {



      ativo = false;



    };



  }, [sessao?.user?.id]);







  useEffect(() => {



    let ativo = true;







    const identificarTipoAcesso = async () => {



      if (!sessao?.user?.id) {



        if (ativo) {



          setTipoAcesso(null);



          setAcessoAdministrativo(null);



          setVinculosIniciais(null);



        }



        return;



      }







      if (processandoConvite) return;







      if (ativo) setTipoAcesso(undefined);







      try {



        // Primeiro identifica se o usuário autenticado pertence ao Control.



        const { data: usuarioPlataforma, error: erroPlataforma } =



          await supabase



            .from("usuarios_plataforma")



            .select("id, perfil, pode_acessar_cliente")



            .eq("user_id", sessao.user.id)



            .eq("ativo", true)



            .maybeSingle();







        if (erroPlataforma) throw erroPlataforma;







        // Se veio do botão "Acessar ambiente", valida no banco o acesso



        // administrativo ativo antes de abrir o ambiente do cliente.



        let contextoSalvo = null;



        try {



          const bruto = localStorage.getItem("precificacont_acesso_control");



          contextoSalvo = bruto ? JSON.parse(bruto) : null;



        } catch {



          contextoSalvo = null;



        }







        if (



          usuarioPlataforma?.id &&



          contextoSalvo?.acesso_id &&



          contextoSalvo?.escritorio_id &&



          (usuarioPlataforma.perfil === "owner" ||



            usuarioPlataforma.pode_acessar_cliente === true)



        ) {



          const { data: acesso, error: erroAcesso } = await supabase



            .from("acessos_administrativos")



            .select("id, escritorio_id, usuario_plataforma_id, ativo")



            .eq("id", contextoSalvo.acesso_id)



            .eq("usuario_plataforma_id", usuarioPlataforma.id)



            .eq("escritorio_id", contextoSalvo.escritorio_id)



            .eq("ativo", true)



            .maybeSingle();







          if (erroAcesso) throw erroAcesso;







          if (acesso?.id) {



            if (ativo) {



              setAcessoAdministrativo({



                acesso_id: acesso.id,



                escritorio_id: acesso.escritorio_id,



                escritorio_nome:



                  contextoSalvo.escritorio_nome || "Escritório",



              });



              setTipoAcesso("escritorio");



            }



            return;



          }







          // Contexto inválido/encerrado: limpa apenas a tentativa administrativa.



          try {



            localStorage.removeItem("precificacont_acesso_control");



          } catch {



            // Sem ação: o roteamento normal continua abaixo.



          }



        }







        // Sem acesso administrativo ativo, usuário da plataforma continua no Control.



        if (usuarioPlataforma?.id) {



          if (ativo) {



            setAcessoAdministrativo(null);



            setTipoAcesso("control");



          }



          return;



        }







        // Se não pertence ao Control, verifica vínculo ativo com escritório cliente.



        const { data: vinculosEscritorio, error: erroEscritorio } =



          await supabase



            .from("usuarios_escritorios")



            .select(



              "id, escritorio_id, nome, cargo, perfil, perfil_acesso_id, ativo"



            )



            .eq("user_id", sessao.user.id)



            .eq("ativo", true);







        if (erroEscritorio) throw erroEscritorio;







        if ((vinculosEscritorio || []).length > 0) {



          if (ativo) {



            setAcessoAdministrativo(null);



            setVinculosIniciais(vinculosEscritorio);



            setTipoAcesso("escritorio");



          }



          return;



        }







        if (ativo) {



          setAcessoAdministrativo(null);



          setTipoAcesso("nao_autorizado");



        }



      } catch (error) {



        console.error("Erro ao identificar tipo de acesso:", error);



        if (ativo) {



          setAcessoAdministrativo(null);



          setTipoAcesso("nao_autorizado");



        }



      }



    };







    identificarTipoAcesso();







    return () => {



      ativo = false;



    };



  }, [sessao?.user?.id, processandoConvite]);







  if (



    sessao === undefined ||



    processandoConvite ||



    (sessao && tipoAcesso === undefined)



  ) {



    return <CarregandoSessao />;



  }







  if (erroConvite) {



    return (



      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">



        <div className="w-full max-w-[520px] rounded-3xl border border-rose-200 bg-white p-7 text-center shadow-xl">



          <ShieldCheck className="mx-auto text-rose-500" size={34} />



          <h1 className="mt-4 text-xl font-bold text-slate-900">



            Não foi possível concluir o convite



          </h1>



          <p className="mt-2 text-sm leading-6 text-slate-600">



            {erroConvite}



          </p>



          <button



            type="button"



            onClick={async () => {



              await supabase.auth.signOut();



              window.location.href = "/";



            }}



            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800"



          >



            Voltar para o login



          </button>



        </div>



      </div>



    );



  }







  if (!sessao) {



    return <TelaLogin onLogin={setSessao} />;



  }







  if (tipoAcesso === "control") {



    return (



      <Suspense fallback={<CarregandoModulo />}>



        <PrecificaContControl sessao={sessao} />



      </Suspense>



    );



  }







  if (tipoAcesso === "escritorio") {



    return (



      <AppAdministrativo



        sessao={sessao}



        acessoAdministrativo={acessoAdministrativo}



        vinculosIniciais={vinculosIniciais}



      />



    );



  }







  return (



    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-5">



      <div className="w-full max-w-[460px] rounded-3xl border border-slate-800 bg-slate-900 p-7 text-center shadow-2xl">



        <ShieldCheck className="mx-auto text-rose-400" size={34} />



        <h1 className="mt-4 text-xl font-bold text-white">



          Acesso não autorizado



        </h1>



        <p className="mt-2 text-sm leading-6 text-slate-400">



          Este usuário não possui vínculo ativo com o PrecificaCont.



        </p>



        <button



          type="button"



          onClick={async () => {



            await supabase.auth.signOut();



            window.location.href = "/";



          }}



          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-slate-900 hover:bg-slate-100"



        >



          Voltar para o login



        </button>



      </div>



    </div>



  );



}







function AppAdministrativo({



  sessao,



  acessoAdministrativo = null,



  vinculosIniciais = null,



}) {



  const [pagina, setPagina] = useState(() => {



    try {



      return (



        localStorage.getItem("precificacont_pagina_atual") || "dashboard"



      );



    } catch {



      return "dashboard";



    }



  });



  const [collapsed, setCollapsed] = useState(false);



  const [saindo, setSaindo] = useState(false);



  const [escritorios, setEscritorios] = useState([]);



  const [escritorioAtivo, setEscritorioAtivo] = useState(null);



  const [carregandoEscritorios, setCarregandoEscritorios] = useState(true);



  const [seletorEscritorioAberto, setSeletorEscritorioAberto] =



    useState(false);



  const [encerrandoAcesso, setEncerrandoAcesso] = useState(false);



  const [modulosPermitidos, setModulosPermitidos] = useState(null);



  const [carregandoModulos, setCarregandoModulos] = useState(true);



  const [modulosVisualizaveisPerfil, setModulosVisualizaveisPerfil] =



    useState(null);



  const [carregandoPermissoesPerfil, setCarregandoPermissoesPerfil] =



    useState(true);



  const [permissoesPerfilPorCodigo, setPermissoesPerfilPorCodigo] =



    useState(null);



  const [tema, setTema] = useState(() => {



    try {



      return localStorage.getItem("precificacont_tema") || "light";



    } catch {



      return "light";



    }



  });







  useEffect(() => {



    let ativo = true;







    const carregarEscritorios = async () => {



      setCarregandoEscritorios(true);







      try {



        // Acesso vindo do Control: abre somente o escritório validado



        // no registro de acesso administrativo.



        if (acessoAdministrativo?.escritorio_id) {



          const { data: escritorio, error: erroEscritorio } = await supabase



            .from("escritorios")



            .select("id, nome")



            .eq("id", acessoAdministrativo.escritorio_id)



            .single();







          if (erroEscritorio) throw erroEscritorio;



          if (!escritorio?.id) {



            throw new Error("O escritório selecionado não está disponível.");



          }







          const selecionado = {



            ...escritorio,



            perfil: "acesso_control",



            cargo: "Acesso administrativo",



          };







          if (!ativo) return;







          setEscritorios([selecionado]);



          setEscritorioAtivo(selecionado);







          try {



            localStorage.setItem(



              "precificacont_escritorio_ativo",



              selecionado.id



            );



          } catch {



            // Mantém a seleção apenas durante a sessão se o storage falhar.



          }







          return;



        }







        // Acesso normal de usuário cliente.



        // Os vínculos já foram validados no AppProtegido. Reutilizamos os mesmos



        // dados aqui para evitar uma segunda ida ao Supabase durante a abertura.



        const vinculos = Array.isArray(vinculosIniciais)



          ? vinculosIniciais



          : [];







        const ids = [



          ...new Set(



            (vinculos || [])



              .map((item) => item.escritorio_id)



              .filter(Boolean)



          ),



        ];







        if (!ids.length) {



          throw new Error(



            "Nenhum escritório ativo foi encontrado para este usuário."



          );



        }







        const { data: dadosEscritorios, error: erroEscritorios } =



          await supabase



            .from("escritorios")



            .select("id, nome, ativo, deleted_at")



            .in("id", ids)



            .eq("ativo", true)



            .is("deleted_at", null);







        if (erroEscritorios) throw erroEscritorios;







        const lista = ids



          .map((id) => {



            const escritorio = (dadosEscritorios || []).find(



              (item) => item.id === id



            );



            const vinculo = (vinculos || []).find(



              (item) => item.escritorio_id === id



            );







            return escritorio



              ? {



                  ...escritorio,



                  perfil: vinculo?.perfil || "usuario",



                  perfil_acesso_id: vinculo?.perfil_acesso_id || null,



                  cargo: vinculo?.cargo || "",



                }



              : null;



          })



          .filter(Boolean);







        if (!ativo) return;







        setEscritorios(lista);







        let idSalvo = "";



        try {



          idSalvo =



            localStorage.getItem("precificacont_escritorio_ativo") || "";



        } catch {



          idSalvo = "";



        }







        const selecionado =



          lista.find((item) => item.id === idSalvo) || lista[0] || null;







        setEscritorioAtivo(selecionado);







        if (selecionado) {



          try {



            // Sempre sincroniza o storage com um vínculo que realmente veio



            // do banco. Assim, um escritório antigo/de teste salvo no navegador



            // não reaparece como contexto válido para o usuário atual.



            localStorage.setItem(



              "precificacont_escritorio_ativo",



              selecionado.id



            );



          } catch {



            // Mantém a seleção apenas durante a sessão se o storage falhar.



          }



        } else {



          try {



            localStorage.removeItem("precificacont_escritorio_ativo");



          } catch {



            // Sem ação.



          }



        }



      } catch (error) {



        console.error("Erro ao carregar escritórios do usuário:", error);



        if (ativo) {



          setEscritorios([]);



          setEscritorioAtivo(null);



        }



      } finally {



        if (ativo) setCarregandoEscritorios(false);



      }



    };







    carregarEscritorios();







    return () => {



      ativo = false;



    };



  }, [



    sessao.user.id,



    acessoAdministrativo?.escritorio_id,



    vinculosIniciais,



  ]);







  useEffect(() => {



    let ativo = true;







    const carregarModulos = async () => {



      if (!escritorioAtivo?.id) {



        if (ativo) {



          setModulosPermitidos(null);



          setCarregandoModulos(false);



        }



        return;



      }







      setCarregandoModulos(true);







      try {



        const { data: escritorio, error: erroEscritorio } = await supabase



          .from("escritorios")



          .select("plano_saas_id")



          .eq("id", escritorioAtivo.id)



          .single();







        if (erroEscritorio) throw erroEscritorio;







        // Compatibilidade: escritórios antigos ainda sem plano_saas_id



        // continuam com acesso completo até que um plano seja atribuído no Control.



        if (!escritorio?.plano_saas_id) {



          if (ativo) setModulosPermitidos(null);



          return;



        }







        // Busca os vínculos primeiro e resolve os módulos em uma consulta separada.



        // Isso evita depender do relacionamento embutido do PostgREST/RLS,



        // que pode retornar os vínculos sem materializar `modulos_saas`.



        const [



          { data: itensPlano, error: erroPlano },



          { data: itensAvulsos, error: erroAvulsos },



        ] = await Promise.all([



          supabase



            .from("plano_modulos")



            .select("modulo_id")



            .eq("plano_id", escritorio.plano_saas_id)



            .eq("incluido", true),



          supabase



            .from("escritorio_modulos")



            .select("modulo_id")



            .eq("escritorio_id", escritorioAtivo.id)



            .eq("ativo", true),



        ]);







        if (erroPlano) throw erroPlano;



        if (erroAvulsos) throw erroAvulsos;







        const idsModulos = [



          ...new Set(



            [...(itensPlano || []), ...(itensAvulsos || [])]



              .map((item) => item?.modulo_id)



              .filter(Boolean)



          ),



        ];







        if (!idsModulos.length) {



          if (ativo) setModulosPermitidos([]);



          return;



        }







        const { data: modulos, error: erroModulos } = await supabase



          .from("modulos_saas")



          .select("id, codigo, ativo")



          .in("id", idsModulos);







        if (erroModulos) throw erroModulos;







        const codigos = (modulos || [])



          .filter((modulo) => modulo?.ativo !== false && modulo?.codigo)



          .map((modulo) => modulo.codigo);







        if (ativo) setModulosPermitidos([...new Set(codigos)]);



      } catch (error) {



        console.error("Erro ao carregar módulos contratados:", error);







        // Falha fechada: se o cliente já tem plano, não libera módulos pagos



        // por engano quando a consulta falhar.



        if (ativo) setModulosPermitidos([]);



      } finally {



        if (ativo) setCarregandoModulos(false);



      }



    };







    carregarModulos();







    return () => {



      ativo = false;



    };



  }, [escritorioAtivo?.id]);







  useEffect(() => {



    let ativo = true;







    const carregarPermissoesPerfil = async () => {



      if (!escritorioAtivo?.id) {



        if (ativo) {



          setModulosVisualizaveisPerfil(null);



          setPermissoesPerfilPorCodigo(null);



          setCarregandoPermissoesPerfil(false);



        }



        return;



      }







      setCarregandoPermissoesPerfil(true);







      try {



        // Acesso administrativo vindo do Control mantém visão total dos



        // módulos contratados da empresa, sem simular um usuário cliente.



        if (acessoAdministrativo?.escritorio_id) {



          if (ativo) {



            setModulosVisualizaveisPerfil(null);



            setPermissoesPerfilPorCodigo(null);



          }



          return;



        }







        // Compatibilidade com administradores antigos: enquanto o vínculo



        // ainda não tiver perfil_acesso_id, o admin não perde acesso.



        if (!escritorioAtivo.perfil_acesso_id) {



          if (ativo) {



            setModulosVisualizaveisPerfil(



              escritorioAtivo.perfil === "admin" ? null : []



            );



            setPermissoesPerfilPorCodigo(



              escritorioAtivo.perfil === "admin" ? null : {}



            );



          }



          return;



        }







        const { data: permissoes, error: erroPermissoes } = await supabase



          .from("perfil_modulos")



          .select(



            "modulo_id,pode_visualizar,pode_criar,pode_editar,pode_excluir"



          )



          .eq("perfil_acesso_id", escritorioAtivo.perfil_acesso_id);







        if (erroPermissoes) throw erroPermissoes;







        const idsPermitidos = [



          ...new Set(



            (permissoes || [])



              .filter((item) => item?.pode_visualizar === true)



              .map((item) => item?.modulo_id)



              .filter(Boolean)



          ),



        ];







        if (!idsPermitidos.length) {



          if (ativo) {



            setModulosVisualizaveisPerfil([]);



            setPermissoesPerfilPorCodigo({});



          }



          return;



        }







        const { data: modulos, error: erroModulos } = await supabase



          .from("modulos_saas")



          .select("id,codigo,ativo")



          .in("id", idsPermitidos);







        if (erroModulos) throw erroModulos;







        const codigos = (modulos || [])



          .filter((modulo) => modulo?.ativo !== false && modulo?.codigo)



          .map((modulo) => modulo.codigo);







        if (ativo) {



          setModulosVisualizaveisPerfil([...new Set(codigos)]);







          const mapaPermissoes = {};



          for (const modulo of modulos || []) {



            if (modulo?.ativo === false || !modulo?.codigo) continue;







            const permissao = (permissoes || []).find(



              (item) => item?.modulo_id === modulo.id



            );







            mapaPermissoes[modulo.codigo] = {



              pode_visualizar: Boolean(permissao?.pode_visualizar),



              pode_criar: Boolean(permissao?.pode_criar),



              pode_editar: Boolean(permissao?.pode_editar),



              pode_excluir: Boolean(permissao?.pode_excluir),



            };



          }







          setPermissoesPerfilPorCodigo(mapaPermissoes);



        }



      } catch (error) {



        console.error("Erro ao carregar permissões do perfil:", error);







        // Falha fechada para usuários não-admin: não libera módulos por engano.



        // Admin legado continua preservado.



        if (ativo) {



          setModulosVisualizaveisPerfil(



            escritorioAtivo?.perfil === "admin" ? null : []



          );



          setPermissoesPerfilPorCodigo(



            escritorioAtivo?.perfil === "admin" ? null : {}



          );



        }



      } finally {



        if (ativo) setCarregandoPermissoesPerfil(false);



      }



    };







    carregarPermissoesPerfil();







    return () => {



      ativo = false;



    };



  }, [



    escritorioAtivo?.id,



    escritorioAtivo?.perfil,



    escritorioAtivo?.perfil_acesso_id,



    acessoAdministrativo?.escritorio_id,



  ]);







  useEffect(() => {



    try {



      localStorage.setItem("precificacont_tema", tema);



    } catch {



      // Se o armazenamento local estiver indisponível, o tema continua



      // funcionando normalmente durante a sessão atual.



    }







    document.documentElement.setAttribute("data-theme", tema);



    document.documentElement.classList.toggle("dark", tema === "dark");



  }, [tema]);







  const alternarTema = () => {



    setTema((atual) => (atual === "dark" ? "light" : "dark"));



  };







  // Mantém a página atual após F5/recarregamento do navegador.



  // A chave é global para a sessão do PrecificaCont e só registra páginas internas.



  useEffect(() => {



    try {



      localStorage.setItem("precificacont_pagina_atual", pagina);



    } catch {



      // Se o armazenamento local estiver indisponível, a navegação continua normal.



    }



  }, [pagina]);







  const voltarAoControl = async () => {



    if (!acessoAdministrativo?.acesso_id || encerrandoAcesso) return;







    setEncerrandoAcesso(true);







    try {



      const { error } = await supabase



        .from("acessos_administrativos")



        .update({



          ativo: false,



          encerrado_em: new Date().toISOString(),



        })



        .eq("id", acessoAdministrativo.acesso_id);







      if (error) throw error;







      try {



        localStorage.removeItem("precificacont_acesso_control");



        localStorage.removeItem("precificacont_escritorio_ativo");



      } catch {



        // O redirecionamento continua mesmo se o storage estiver indisponível.



      }







      window.location.href = "/";



    } catch (error) {



      console.error("Erro ao encerrar acesso administrativo:", error);



      window.alert(



        error?.message ||



          "Não foi possível encerrar o acesso administrativo agora."



      );



      setEncerrandoAcesso(false);



    }



  };







  const sair = async () => {



    if (saindo) return;







    setSaindo(true);







    try {



      if (acessoAdministrativo?.acesso_id) {



        const { error: erroAcesso } = await supabase



          .from("acessos_administrativos")



          .update({



            ativo: false,



            encerrado_em: new Date().toISOString(),



          })



          .eq("id", acessoAdministrativo.acesso_id);







        if (erroAcesso) throw erroAcesso;



      }







      try {



        localStorage.removeItem("precificacont_acesso_control");



        localStorage.removeItem("precificacont_escritorio_ativo");



      } catch {



        // O logout continua mesmo se o storage estiver indisponível.



      }







      const { error } = await supabase.auth.signOut();



      if (error) throw error;







      window.location.href = "/";



    } catch (error) {



      console.error("Erro ao sair:", error);



      window.alert(error?.message || "Não foi possível sair agora.");



      setSaindo(false);



    }



  };







  const trocarEscritorio = (escritorio) => {



    if (!escritorio?.id || escritorio.id === escritorioAtivo?.id) {



      setSeletorEscritorioAberto(false);



      return;



    }







    setEscritorioAtivo(escritorio);



    setSeletorEscritorioAberto(false);







    try {



      localStorage.setItem("precificacont_escritorio_ativo", escritorio.id);



    } catch {



      // A troca continua válida durante a sessão.



    }







    // Reinicia a aplicação para que todos os módulos, caches e consultas



    // que dependem do escritório ativo sejam carregados no novo contexto.



    window.location.reload();



  };







  const mapaModuloPagina = {



    nova: "nova_simulacao",



    simulacoes: "historico_simulacoes",



    reprecificacao: "reprecificacao",



    clientes: "clientes",



    relatorios: "relatorios",



    servicos: "servicos_adicionais",



    propostas: "propostas",



    crm: "crm",



  };







  const temModuloContratado = (codigo) => {



    if (!codigo) return true;



    if (modulosPermitidos === null) return true;



    return modulosPermitidos.includes(codigo);



  };







  const temModuloPerfil = (codigo) => {



    if (!codigo) return true;



    if (modulosVisualizaveisPerfil === null) return true;



    return modulosVisualizaveisPerfil.includes(codigo);



  };







  const temModulo = (codigo) =>



    temModuloContratado(codigo) && temModuloPerfil(codigo);







  const permissoesDoModulo = (codigo) => {



    if (!codigo) {



      return {



        pode_visualizar: true,



        pode_criar: true,



        pode_editar: true,



        pode_excluir: true,



      };



    }







    if (permissoesPerfilPorCodigo === null) {



      return {



        pode_visualizar: true,



        pode_criar: true,



        pode_editar: true,



        pode_excluir: true,



      };



    }







    return (



      permissoesPerfilPorCodigo?.[codigo] || {



        pode_visualizar: false,



        pode_criar: false,



        pode_editar: false,



        pode_excluir: false,



      }



    );



  };







  const paginaLiberada = (paginaAlvo) => {



    const codigoModulo = mapaModuloPagina[paginaAlvo];







    // Dashboard, Configurações e Minha Conta não são módulos comerciais



    // e continuam disponíveis independentemente do plano.



    if (!codigoModulo) return true;







    return temModulo(codigoModulo);



  };







  useEffect(() => {



    if (carregandoModulos || carregandoPermissoesPerfil) return;







    if (!paginaLiberada(pagina)) {



      setPagina("dashboard");



    }



  }, [



    pagina,



    carregandoModulos,



    carregandoPermissoesPerfil,



    modulosPermitidos,



    modulosVisualizaveisPerfil,



  ]);







  const renderPagina = () => {



    switch (pagina) {



      case "dashboard":



        return <Dashboard setPagina={setPagina} />;







      case "nova":



        return (



          <NovaSimulacao



            setPagina={setPagina}



            permissoesNovaSimulacao={permissoesDoModulo("nova_simulacao")}



          />



        );







      case "simulacoes":



        return (



          <Simulacoes



            setPagina={setPagina}



            permissoesSimulacoes={permissoesDoModulo(



              "historico_simulacoes"



            )}



          />



        );







      case "reprecificacao":



        return (



          <Reprecificacao



            setPagina={setPagina}



            permissoesReprecificacao={permissoesDoModulo("reprecificacao")}



          />



        );







      case "clientes":



        return (



          <Clientes



            setPagina={setPagina}



            permissoesClientes={permissoesDoModulo("clientes")}



          />



        );







      case "relatorios":



        return (



          <Relatorios



            setPagina={setPagina}



            permissoesRelatorios={permissoesDoModulo("relatorios")}



            permissoesCRM={permissoesDoModulo("crm")}



          />



        );







      case "servicos":



        return <ServicosAdicionais />;







      case "propostas":



        return <Propostas setPagina={setPagina} />;







      case "crm":



        return <CRMComercial setPagina={setPagina} />;







      case "reforma-tributaria":



        // Módulo preservado para ativação futura; acesso oculto no lançamento.
        return <Dashboard setPagina={setPagina} />;







      case "configuracoes":



        return <Configuracoes />;







      case "minha-conta":



        return <MinhaConta />;







      default:



        return <Dashboard setPagina={setPagina} />;



    }



  };







  const dark = tema === "dark";







  // Evita o "pisca" do menu: a estrutura principal só é montada depois



  // que o escritório ativo e os módulos contratados estiverem resolvidos.



  if (



    carregandoEscritorios ||



    !escritorioAtivo ||



    carregandoModulos ||



    carregandoPermissoesPerfil



  ) {



    return (



      <div



        data-theme={tema}



        className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${



          dark ? "bg-[#07101f]" : "bg-slate-50"



        }`}



      >



        <div className="text-center">



          <Loader2 className="mx-auto animate-spin text-blue-600" size={34} />



          <p



            className={`mt-3 text-sm font-medium ${



              dark ? "text-slate-400" : "text-slate-500"



            }`}



          >



            Carregando PrecificaCont...



          </p>



        </div>



      </div>



    );



  }







  return (



    <div



      data-theme={tema}



      className={`min-h-screen transition-colors duration-300 ${



        dark ? "bg-[#07101f]" : "bg-slate-50"



      }`}



    >



      <Sidebar



        pagina={pagina}



        setPagina={setPagina}



        collapsed={collapsed}



        setCollapsed={setCollapsed}



        escritorioAtivo={escritorioAtivo}



        escritorios={escritorios}



        modulosPermitidos={



          modulosPermitidos === null &&



          modulosVisualizaveisPerfil === null



            ? null



            : Object.values(mapaModuloPagina).filter((codigo) =>



                temModulo(codigo)



              )



        }



        carregandoModulos={



          carregandoModulos || carregandoPermissoesPerfil



        }



      />







      <main



        className={`min-h-screen transition-all duration-300 ${



          collapsed ? "ml-[82px]" : "ml-[260px]"



        } ${dark ? "bg-[#07101f]" : "bg-slate-50"}`}



      >



        <div className="fixed right-5 top-4 z-[70] flex items-center gap-2">



          {!carregandoEscritorios && escritorios.length > 1 ? (



            <div className="relative">



              <button



                type="button"



                onClick={() =>



                  setSeletorEscritorioAberto((valor) => !valor)



                }



                className={`inline-flex h-9 max-w-[280px] items-center gap-2 rounded-xl border px-3 text-xs font-semibold shadow-sm backdrop-blur transition ${



                  dark



                    ? "border-slate-700 bg-slate-900/95 text-slate-300 hover:border-slate-600 hover:bg-slate-800"



                    : "border-slate-200 bg-white/95 text-slate-600 hover:border-slate-300 hover:bg-white"



                }`}



                title="Trocar escritório"



              >



                <Building2 size={15} className="shrink-0" />



                <span className="truncate">



                  {escritorioAtivo?.nome || "Selecionar escritório"}



                </span>



                <ChevronDown size={14} className="shrink-0" />



              </button>







              {seletorEscritorioAberto ? (



                <div



                  className={`absolute right-0 mt-2 w-[300px] overflow-hidden rounded-2xl border p-2 shadow-2xl ${



                    dark



                      ? "border-slate-700 bg-slate-900"



                      : "border-slate-200 bg-white"



                  }`}



                >



                  <div className="px-3 pb-2 pt-1">



                    <p



                      className={`text-[10px] font-bold uppercase tracking-[0.16em] ${



                        dark ? "text-slate-500" : "text-slate-400"



                      }`}



                    >



                      Escritório ativo



                    </p>



                  </div>







                  {escritorios.map((escritorio) => {



                    const selecionado =



                      escritorio.id === escritorioAtivo?.id;







                    return (



                      <button



                        key={escritorio.id}



                        type="button"



                        onClick={() => trocarEscritorio(escritorio)}



                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${



                          selecionado



                            ? dark



                              ? "bg-blue-500/10 text-blue-300"



                              : "bg-blue-50 text-blue-700"



                            : dark



                              ? "text-slate-300 hover:bg-slate-800"



                              : "text-slate-700 hover:bg-slate-50"



                        }`}



                      >



                        <div



                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${



                            selecionado



                              ? "bg-blue-600 text-white"



                              : dark



                                ? "bg-slate-800 text-slate-400"



                                : "bg-slate-100 text-slate-500"



                          }`}



                        >



                          <Building2 size={17} />



                        </div>







                        <div className="min-w-0">



                          <p className="truncate text-sm font-bold">



                            {escritorio.nome}



                          </p>



                          <p



                            className={`mt-0.5 text-[11px] ${



                              dark



                                ? "text-slate-500"



                                : "text-slate-400"



                            }`}



                          >



                            {selecionado



                              ? "Selecionado"



                              : "Trocar para este escritório"}



                          </p>



                        </div>



                      </button>



                    );



                  })}



                </div>



              ) : null}



            </div>



          ) : null}







          <button



            type="button"



            onClick={alternarTema}



            title={dark ? "Ativar modo claro" : "Ativar modo escuro"}



            aria-label={



              dark ? "Ativar modo claro" : "Ativar modo escuro"



            }



            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm backdrop-blur transition ${



              dark



                ? "border-slate-700 bg-slate-900/95 text-amber-300 hover:border-slate-600 hover:bg-slate-800"



                : "border-slate-200 bg-white/95 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-blue-600"



            }`}



          >



            {dark ? <Sun size={16} /> : <Moon size={16} />}



          </button>







          <button



            type="button"



            onClick={sair}



            disabled={saindo}



            title={sessao?.user?.email || "Usuário autenticado"}



            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm backdrop-blur transition disabled:opacity-60 ${



              dark



                ? "border-slate-700 bg-slate-900/95 text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white"



                : "border-slate-200 bg-white/95 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-900"



            }`}



          >



            {saindo ? (



              <Loader2 size={15} className="animate-spin" />



            ) : (



              <LogOut size={15} />



            )}



            {saindo ? "Saindo..." : "Sair"}



          </button>



        </div>







        {acessoAdministrativo ? (



          <div className="sticky top-0 z-[60] border-b border-amber-200 bg-amber-50 px-5 py-3 shadow-sm">



            <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">



              <div className="flex min-w-0 items-center gap-3">



                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">



                  <ShieldCheck size={18} />



                </div>



                <div className="min-w-0">



                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">



                    Acesso administrativo



                  </p>



                  <p className="truncate text-sm font-bold text-slate-900">



                    Você está visualizando o ambiente de{" "}



                    {escritorioAtivo?.nome ||



                      acessoAdministrativo.escritorio_nome ||



                      "Escritório"}



                  </p>



                  <p className="text-xs text-slate-500">



                    Usuário autenticado: {sessao?.user?.email}



                  </p>



                </div>



              </div>







              <button



                type="button"



                onClick={voltarAoControl}



                disabled={encerrandoAcesso}



                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"



              >



                {encerrandoAcesso ? (



                  <Loader2 size={15} className="animate-spin" />



                ) : (



                  <ShieldCheck size={15} />



                )}



                {encerrandoAcesso ? "Encerrando..." : "Voltar ao Control"}



              </button>



            </div>



          </div>



        ) : null}







        <Suspense fallback={<CarregandoModulo />}>



          {renderPagina()}



        </Suspense>



      </main>



    </div>



  );



}







export default App;