"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiService } from '@/lib/api';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Define form schema
const formSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyUrl: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      companyUrl: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!values.companyName.trim()) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // First check if the company already has cached data
      const cacheStatus = await apiService.checkCacheStatus(values.companyName);
      
      if (cacheStatus.exists && cacheStatus.files?.some(f => f.name === 'final_proposal.json')) {
        // If complete data exists, redirect to dashboard
        router.push(`/dashboard/${values.companyName}`);
      } else {
        // If no cached data or incomplete data and URL is provided, generate new analysis
        if (values.companyUrl?.trim()) {
          // Start analysis in the background
          try {
            // Just start the analysis, don't wait for it to complete
            apiService.generateAnalysis(values.companyUrl, values.companyName);
            // Redirect to loading page immediately
            router.push(`/loading/${values.companyName}`);
          } catch (error) {
            console.error('Error starting analysis:', error);
            setError('Error starting analysis. Please try again.');
            setIsLoading(false);
          }
        } else {
          setError('Company URL is required for new analysis generation');
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-gradient-to-b from-transparent to-muted/20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">AI Transformation Plan Generator</CardTitle>
          <CardDescription>
            Enter a company name and URL to generate an AI transformation strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Airbnb, Spotify" 
                        {...field}
                        required
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the name of the company to analyze
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., https://www.airbnb.com" 
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Required only for new analysis generation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Generate Analysis'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            This tool analyzes company data to generate AI transformation strategies
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
