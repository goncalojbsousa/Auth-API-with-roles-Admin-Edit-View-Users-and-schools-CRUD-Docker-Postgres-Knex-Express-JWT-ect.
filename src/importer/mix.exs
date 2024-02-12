defmodule Importer.MixProject do
  use Mix.Project

  def project do
    [
      app: :importer,
      version: "0.1.0",
      elixir: "~> 1.12",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      extra_applications: [:logger],
      mod: {Importer.Application, []}
    ]
  end

  defp deps do
    [
      {:sweet_xml, "~> 0.7.4"}
    ]
  end
end

defmodule XmlImporter do
  @moduledoc """
  This module provides functions for reading XML files.
  """

  @doc """
  Reads the contents of an XML file named 'metadata.xml'.
  
  ## Examples
  
      iex> XmlImporter.read_xml()
      {:ok, xml_content}
  """
  def read_xml do
    File.read!("metadata.xml")
  end
end
defmodule XmlExtractor do
  require SweetXml

  def parse_xml do
    xml = File.read!("example.xml") |> parse_namespaces()

    file_identifier = extract_file_identifier(xml)
    contact_details = extract_contact_details(xml)
    publication_date = extract_publication_date(xml)

    %{
      file_identifier: file_identifier,
      contact_details: contact_details,
      publication_date: publication_date
    }
  end

  defp parse_namespaces(xml) do
    SweetXml.parse(xml, namespaces: [
      gmd: "http://www.isotc211.org/2005/gmd",
      gco: "http://www.isotc211.org/2005/gco",
      gml: "http://www.opengis.net/gml"
      # Adicione mais namespaces conforme necessário
    ])
  end

  defp extract_file_identifier(xml) do
    xml |> SweetXml.xpath(~x"/gmd:MD_Metadata/gmd:fileIdentifier/gco:CharacterString/text()"s)
  end

  defp extract_contact_details(xml) do
    %{ 
      contact_name: xml |> SweetXml.xpath(~x"//gmd:contact/gmd:CI_ResponsibleParty/gmd:individualName/gco:CharacterString/text()"s),
      contact_email: xml |> SweetXml.xpath(~x"//gmd:contact/gmd:CI_ResponsibleParty/gmd:contactInfo/gmd:CI_Contact/gmd:address/gmd:CI_Address/gmd:electronicMailAddress/gco:CharacterString/text()"s)
    }
  end

  defp extract_publication_date(xml) do
    xml |> SweetXml.xpath(~x"//gmd:identificationInfo/gmd:MD_DataIdentification/gmd:citation/gmd:CI_Citation/gmd:date/gmd:CI_Date/gmd:date/gco:Date/text()"s)
  end
end
