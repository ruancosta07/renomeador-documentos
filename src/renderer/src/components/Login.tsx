import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import supabase from "@main/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router";

export default function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = toast.loading("Fazendo login...")
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if(error){
        toast.error("Email incorreto")
        return
      }
      navigate("/")
      
    } catch (error) {
      console.log(error);
    } finally{
      toast.dismiss(t)
    }
  };

  return (
    <main className="h-dvh flex items-center justify-center">
      <div className={cn("flex flex-col gap-6 w-[60%]", className)} {...props}>
        <Card>
          <CardHeader>
            <CardTitle>Faça login para continuar</CardTitle>
            {/* <CardDescription>
            Enter your email below to login to your account
          </CardDescription> */}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={({ target: { value } }) => setEmail(value)}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Senha</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={({ target: { value } }) => setPassword(value)}
                    placeholder="*********"
                    required 
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <Button type="submit" className="w-full">
                    Entrar
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
