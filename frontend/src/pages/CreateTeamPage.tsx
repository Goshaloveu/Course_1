import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast"; // Assuming shadcn/ui toast
import { createTeam } from '@/api/teams';
import { TeamCreate } from '@/types/team';

// Validation Schema
const formSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters long.").max(50, "Team name cannot exceed 50 characters."),
  tag: z.string().max(10, "Team tag cannot exceed 10 characters.").optional().or(z.literal('')), // Optional tag
  // Add description later if needed in creation form
});

type CreateTeamFormValues = z.infer<typeof formSchema>;

const CreateTeamPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateTeamFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      tag: "",
    },
  });

  async function onSubmit(values: CreateTeamFormValues) {
    setIsLoading(true);
    try {
      // Prepare data matching TeamCreate interface (omit empty tag)
      const teamData: TeamCreate = {
        name: values.name,
        tag: values.tag || null, // Send null if tag is empty
      };

      const newTeam = await createTeam(teamData);
      toast({
        title: "Команда создана",
        description: `Команда "${newTeam.name}" успешно создана.`,
      });
      // Navigate to the new team's detail page or My Teams page
      navigate(`/teams/${newTeam.id}`); 
      // or navigate(`/my-teams`);
    } catch (error: any) {
      console.error("Не удалось создать команду:", error);
      const errorMessage = error.response?.data?.detail || "Не удалось создать команду. Попробуйте еще раз.";
      toast({
        variant: "destructive",
        title: "Ошибка при создании команды",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Создать новую команду</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Название команды</FormLabel>
                <FormControl>
                  <Input placeholder="Введите название команды" {...field} disabled={isLoading} />
                </FormControl>
                <FormDescription>
                  Это будет публичное название вашей команды.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tag"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тег команды (Необязательно)</FormLabel>
                <FormControl>
                  {/* Ensure field.value is never null for the Input component */}
                  <Input placeholder="Короткое имя " {...field} value={field.value ?? ''} disabled={isLoading} />
                </FormControl>
                 <FormDescription>
                  Короткое имя или аббревиатура (максимум 10 символов).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Создание..." : "Команда создана!"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default CreateTeamPage; 