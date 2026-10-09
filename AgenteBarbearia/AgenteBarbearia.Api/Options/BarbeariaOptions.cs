namespace AgenteBarbearia.Api.Options
{
    public class BarbeariaOptions
    {
        public const string SectionName = "Barbearia";

        public string Nome { get; set; } = "Barbearia";
        public int[] DiasFuncionamento { get; set; } = [2, 3, 4, 5, 6];
        public string Abre { get; set; } = "09:00";
        public string Fecha { get; set; } = "19:00";
        public string IntervaloAlmocoInicio { get; set; } = "12:00";
        public string IntervaloAlmocoFim { get; set; } = "13:00";
        public int SlotMinutos { get; set; } = 30;
    }
}
