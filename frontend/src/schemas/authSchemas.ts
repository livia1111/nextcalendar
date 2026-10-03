import { z } from 'zod'

export const LoginSchema = z.object({
    email: z.email('Email invalido'),
    password:z.string().min(6,'A senha precisa ter no minimo 6 caracteres'),
});

export const RegisterSchema = z.object({
    name: z.string().trim().min(3, 'Nome muito curto').refine(val => val.includes(' '), 'Digite seu nome e sobrenome'),
    email:z.email('Email inválido'),
    phone: z.string().refine(val => {
        const numbers = val.replace(/\D/g, '');
        return numbers.length >= 10 && numbers.length <= 11;
    }, 'Telefone inválido (DDD + número)'),
    password:z.string().min(6,'Mínimo 6 caracteres'),
    dateOfBirth: z.string().min(10, 'Informe uma data de nascimento válida (DD/MM/AAAA)'),
})

export const RegisterEmpresaSchema = z.object({
    name: z.string().trim().min(3, 'Nome muito curto').refine(val => val.includes(' '), 'Digite seu nome e sobrenome'),
    email: z.email('Email inválido'),
    phone: z.string().refine(val => {
        const numbers = val.replace(/\D/g, '');
        return numbers.length >= 10 && numbers.length <= 11;
    }, 'Telefone inválido (DDD + número)'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    
    // Campos da empresa
    legalName: z.string().min(3, 'Razão social obrigatória'),
    companyName: z.string().min(3, 'Nome fantasia obrigatório'),
    cnpj: z.string().refine(val => {
        const numbers = val.replace(/\D/g, '');
        return numbers.length === 14;
    }, 'CNPJ inválido (14 dígitos)'),
    whatsapp: z.string().optional(),
    
    // Endereço
    cep: z.string().refine(val => val.replace(/\D/g, '').length === 8, 'CEP inválido'),
    street: z.string().min(3, 'Rua obrigatória'),
    number: z.string().min(1, 'Número obrigatório'),
    complement: z.string().optional(),
    city: z.string().min(2, 'Cidade obrigatória'),
    neighborhood: z.string().min(2, 'Bairro obrigatório'),
    state: z.string().min(2, 'Estado obrigatório'),
});

export type LoginInput =  z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type RegisterEmpresaInput = z.infer<typeof RegisterEmpresaSchema>;

/** Schema de troca de senha — usado na tela trocar-senha.tsx */
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    newPassword: z
      .string()
      .min(8, 'A nova senha deve ter no mínimo 8 caracteres.')
      .refine(val => /[a-zA-Z]/.test(val), 'A nova senha deve conter ao menos uma letra.')
      .refine(val => /[0-9]/.test(val), 'A nova senha deve conter ao menos um número.'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'A nova senha e a confirmação não coincidem.',
    path: ['confirmPassword'],
  })
  .refine(data => data.newPassword !== data.currentPassword, {
    message: 'A nova senha não pode ser igual à senha atual.',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;